import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Helper to compute dynamic customer stats directly from real database orders
function computeCustomerStats(customer: any) {
  const orders = customer.orders || [];

  // 1. Total KOT Orders (Count approved/active/completed orders)
  const totalOrders = orders.filter((o: any) => o.status !== 'CANCELLED').length;

  // 2. Total Cafe Visits (Distinct calendar days on which customer placed orders, minimum 1)
  const uniqueVisitDates = new Set(
    orders.map((o: any) => new Date(o.createdAt).toISOString().split('T')[0])
  );
  const totalVisits = Math.max(uniqueVisitDates.size, orders.length > 0 ? uniqueVisitDates.size : 1);

  // 3. Most Ordered Item
  const itemCounts: Record<string, number> = {};
  orders.forEach((ord: any) => {
    if (ord.items && Array.isArray(ord.items)) {
      ord.items.forEach((it: any) => {
        const name = it.menuItemName;
        itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 1);
      });
    }
  });

  let favouriteItem = 'Special Mini Meals';
  let maxCount = 0;
  Object.entries(itemCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favouriteItem = name;
    }
  });

  return {
    totalVisits,
    totalOrders,
    favouriteItem: orders.length > 0 ? favouriteItem : 'Special Dosa',
  };
}

export async function identifyCustomer(req: Request, res: Response) {
  try {
    const { mobile, name } = req.body;
    if (!mobile || String(mobile).trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required' });
    }

    const cleanMobile = String(mobile).trim();

    let customer = await prisma.customer.findUnique({
      where: { mobile: cleanMobile },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            table: true,
            items: true,
          },
        },
      },
    });

    if (customer) {
      if (name && String(name).trim() && String(name).trim() !== customer.name) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name: String(name).trim() },
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              include: {
                table: true,
                items: true,
              },
            },
          },
        });
      }
    } else {
      if (!name || !String(name).trim()) {
        return res.json({
          success: true,
          exists: false,
          message: 'New customer. Name is required.',
        });
      }

      customer = await prisma.customer.create({
        data: {
          mobile: cleanMobile,
          name: String(name).trim(),
          totalVisits: 1,
        },
        include: {
          orders: {
            include: {
              table: true,
              items: true,
            },
          },
        },
      });
    }

    const stats = computeCustomerStats(customer);

    // Calculate active vs previous orders
    const activeOrders = customer.orders.filter(
      (o) => o.status === 'PENDING_APPROVAL' || o.status === 'ACTIVE'
    );
    const previousOrders = customer.orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'CANCELLED'
    );

    return res.json({
      success: true,
      exists: true,
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        totalVisits: stats.totalVisits,
        totalOrders: stats.totalOrders,
        favouriteItem: stats.favouriteItem,
      },
      activeOrders,
      previousOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCustomerProfile(req: Request, res: Response) {
  try {
    const mobileStr = String(req.params.mobile || '');
    if (!mobileStr) return res.status(400).json({ success: false, message: 'Mobile is required' });

    const customer = await prisma.customer.findUnique({
      where: { mobile: mobileStr.trim() },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const stats = computeCustomerStats(customer);

    return res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        totalVisits: stats.totalVisits,
        totalOrders: stats.totalOrders,
        favouriteItem: stats.favouriteItem,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
