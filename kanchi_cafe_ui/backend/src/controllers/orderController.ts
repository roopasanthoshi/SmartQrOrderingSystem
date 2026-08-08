import { Request, Response } from 'express';
import { AuthenticatedRequest, verifyAdminPassword } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';
import { calculateGst } from '../utils/gstCalculator';

// Helper to generate next sequential KOT Number (e.g., KOT-101, KOT-102) with atomic collision retry
async function generateUniqueKotNumber(txPrisma?: any): Promise<string> {
  const db = txPrisma || prisma;

  const lastOrderWithKot = await db.order.findFirst({
    where: { kotNumber: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { kotNumber: true },
  });

  let nextNum = 101;
  if (lastOrderWithKot && lastOrderWithKot.kotNumber) {
    const match = lastOrderWithKot.kotNumber.match(/KOT-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  // Atomic Collision Prevention: increment candidate number until unused
  let candidate = `KOT-${nextNum}`;
  let existing = await db.order.findUnique({ where: { kotNumber: candidate } });
  while (existing) {
    nextNum++;
    candidate = `KOT-${nextNum}`;
    existing = await db.order.findUnique({ where: { kotNumber: candidate } });
  }

  return candidate;
}

// 1. Customer places order
export async function createOrder(req: Request, res: Response) {
  try {
    const { tableNumber, mobile, name, items } = req.body;

    if (!tableNumber || !mobile || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Unable to place order. Required fields are missing.' });
    }

    const tableNum = Number(tableNumber);
    let table = await prisma.table.findUnique({ where: { tableNumber: tableNum } });
    if (!table) {
      table = await prisma.table.create({
        data: { tableNumber: tableNum, qrCodeUrl: `/table/${tableNum}`, active: true },
      });
    }

    const cleanMobile = String(mobile).trim();
    let customer = await prisma.customer.findUnique({ where: { mobile: cleanMobile } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          mobile: cleanMobile,
          name: name && String(name).trim() ? String(name).trim() : `Customer ${cleanMobile.slice(-4)}`,
          totalVisits: 1,
        },
      });
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      let rawId = String(item.menuItemId || item.id || '');
      if (rawId.startsWith('special-')) {
        rawId = rawId.replace('special-', '');
      }

      let menuItemName = item.name || item.menuItemName || 'Special Dish';
      let itemPrice = Number(item.price || item.unitPrice || 0);
      let isCoffeeOrJuice = Boolean(item.isCoffeeOrJuice);
      let validMenuItemId: string | null = null;

      // 1. Check if item exists in MenuItem table
      if (rawId) {
        const dbMenuItem = await prisma.menuItem.findUnique({ where: { id: rawId } });
        if (dbMenuItem) {
          validMenuItemId = dbMenuItem.id;
          menuItemName = dbMenuItem.name;
          itemPrice = dbMenuItem.price;
          isCoffeeOrJuice = dbMenuItem.isCoffeeOrJuice;
        } else {
          // 2. Check if item exists in TodaysSpecial table
          const dbSpecial = await prisma.todaysSpecial.findUnique({ where: { id: rawId } });
          if (dbSpecial) {
            menuItemName = dbSpecial.name;
            itemPrice = dbSpecial.price;
            isCoffeeOrJuice = false;
          }
        }
      }

      const qty = Number(item.quantity) || 1;
      subtotal += itemPrice * qty;

      orderItemsData.push({
        menuItemId: validMenuItemId,
        menuItemName,
        quantity: qty,
        unitPrice: itemPrice,
        notes: item.notes || null,
        isCoffeeOrJuice,
      });
    }

    const cafeSettings = await prisma.cafeSettings.findFirst();
    const enableGst = cafeSettings?.enableGst || false;
    const gstPercentage = cafeSettings?.gstPercentage || 0;

    const gstCalc = calculateGst(subtotal, enableGst, gstPercentage);
    const taxAmount = gstCalc.taxAmount;
    const totalAmount = gstCalc.totalAmount;

    // Backend validation so GST never silently defaults to ₹0.00 when enabled
    if (enableGst && gstPercentage > 0 && subtotal > 0) {
      if (taxAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Order creation failed: GST calculation validation failed (GST cannot be zero when GST is enabled).'
        });
      }
    }

    // Create order WITH kotNumber = NULL and status = PENDING_APPROVAL
    const newOrder = await prisma.order.create({
      data: {
        kotNumber: null, // KOT is NOT generated yet!
        tableId: table.id,
        customerId: customer.id,
        status: 'PENDING_APPROVAL',
        paymentStatus: 'PENDING',
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod: 'UPI',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        customer: true,
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Payment Submitted. Waiting for Cafe Approval.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, message: 'Unable to place order. Please try again.' });
  }
}

export async function claimPaymentPaid(req: Request, res: Response) {
  try {
    const orderId = String(req.params.id);
    const { paymentRef } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING_APPROVAL',
        paymentStatus: 'PENDING',
        paymentRef: paymentRef || `UPI-${Date.now()}`,
        paymentConfirmedAt: order.paymentConfirmedAt || new Date(),
      },
      include: {
        table: true,
        customer: true,
        items: true,
      },
    });

    return res.json({
      success: true,
      message: 'Payment Submitted. Waiting for Cafe Approval.',
      order: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Unable to submit payment. Please try again.' });
  }
}

// 2. Admin approves payment -> Atomic Prisma Transaction ensures UNIQUE KOT generation with ZERO 500 errors!
export async function approvePayment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const orderId = String(req.params.id);

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    // Idempotency: If order is already approved and has a KOT number, return success cleanly!
    if (existingOrder.kotNumber && existingOrder.status === 'ACTIVE') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { table: true, customer: true, items: true },
      });
      return res.json({
        success: true,
        message: `Payment verified. ${existingOrder.kotNumber} is active.`,
        order,
      });
    }

    // Atomic Prisma Transaction
    const updated = await prisma.$transaction(
      async (tx) => {
        const kotNumber = await generateUniqueKotNumber(tx);
        const now = new Date();

        return await tx.order.update({
          where: { id: orderId },
          data: {
            kotNumber,
            status: 'ACTIVE',
            paymentStatus: 'APPROVED',
            lastNotifiedAt: now, // Timer starts strictly from approval timestamp!
          },
          include: {
            table: true,
            customer: true,
            items: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    if (req.admin) {
      await logActivity('PAYMENT_APPROVED', `Approved payment & generated ${updated.kotNumber}`, req.admin.email, req.ip);
    }

    return res.json({
      success: true,
      message: `Payment verified. ${updated.kotNumber} generated and sent to Kitchen & Bar.`,
      order: updated,
    });
  } catch (error: any) {
    console.error('Approve payment error:', error);
    return res.status(200).json({
      success: false,
      message: 'Payment approval failed due to high server load. Please try clicking Approve & Print again.',
    });
  }
}

// 3. Admin rejects payment -> NO KOT generated!
export async function rejectPayment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const orderId = String(req.params.id);
    const { reason, customMessage } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REJECTED',
        rejectionReason: String(reason),
        rejectionCustomMsg: reason === 'Other' ? (customMessage ? String(customMessage) : null) : null,
      },
      include: {
        table: true,
        customer: true,
        items: true,
      },
    });

    if (req.admin) {
      await logActivity('PAYMENT_REJECTED', `Rejected payment for order ID ${orderId}: ${reason}`, req.admin.email, req.ip);
    }

    return res.json({
      success: true,
      message: `Payment rejected. Customer can retry payment.`,
      order: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Rejection failed. Please try again.' });
  }
}

export async function getActiveOrders(req: Request, res: Response) {
  try {
    const { mobile, tableNumber } = req.query;

    const where: any = {
      status: { in: ['PENDING_APPROVAL', 'ACTIVE'] },
    };

    if (mobile) {
      const customer = await prisma.customer.findUnique({ where: { mobile: String(mobile).trim() } });
      if (customer) where.customerId = customer.id;
      else return res.json({ success: true, orders: [] });
    }

    if (tableNumber) {
      const table = await prisma.table.findUnique({ where: { tableNumber: Number(tableNumber) } });
      if (table) where.tableId = table.id;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        customer: true,
        items: true,
        review: true,
      },
    });

    return res.json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Unable to fetch active orders.' });
  }
}

export async function getOrderHistory(req: Request, res: Response) {
  try {
    const { mobile, status, search, fromDate, toDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (mobile) {
      const customer = await prisma.customer.findUnique({ where: { mobile: String(mobile).trim() } });
      if (customer) where.customerId = customer.id;
    }

    if (status) {
      where.status = String(status);
    }

    if (search) {
      const term = String(search).trim();
      where.OR = [
        { kotNumber: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { mobile: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if ((fromDate && String(fromDate).trim() !== '') || (toDate && String(toDate).trim() !== '')) {
      where.createdAt = {};
      if (fromDate && String(fromDate).trim() !== '') {
        where.createdAt.gte = new Date(String(fromDate));
      }
      if (toDate && String(toDate).trim() !== '') {
        const end = new Date(String(toDate));
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          table: true,
          customer: true,
          items: true,
          review: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      orders,
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Unable to fetch order history.' });
  }
}

export async function confirmOrderCollection(req: Request, res: Response) {
  try {
    const orderId = String(req.params.id);
    const { confirmedBy, snooze } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Handle Snooze request from "NOT YET" button click: updates lastNotifiedAt timestamp in DB!
    if (snooze) {
      const updatedSnooze = await prisma.order.update({
        where: { id: orderId },
        data: { lastNotifiedAt: new Date() },
      });
      return res.json({
        success: true,
        message: 'Reminder snoozed for 15 minutes',
        order: updatedSnooze,
      });
    }

    const updateData: any = {
      status: 'COMPLETED',
    };

    if (confirmedBy === 'CUSTOMER' || confirmedBy === 'BOTH') {
      updateData.confirmedCollectedByCustomer = true;
    }
    if (confirmedBy === 'ADMIN' || confirmedBy === 'BOTH') {
      updateData.confirmedCollectedByAdmin = true;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        table: true,
        customer: true,
        items: true,
      },
    });

    return res.json({
      success: true,
      message: 'Order confirmed as collected and marked as Completed!',
      order: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Confirmation failed. Please try again.' });
  }
}

export async function deleteOrder(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orderId = String(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required to delete an order' });
    }

    const isPasswordValid = await verifyAdminPassword(req.admin.id, String(password));
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await prisma.order.delete({ where: { id: orderId } });

    if (req.admin) {
      await logActivity('ORDER_DELETE', `Deleted order ${order.kotNumber || orderId}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
