import { Response } from 'express';
import { AuthenticatedRequest, verifyAdminPassword } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function getTables(req: AuthenticatedRequest, res: Response) {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING_APPROVAL', 'ACTIVE'] },
          },
          select: {
            id: true,
            customerId: true,
            status: true,
            kotNumber: true,
          },
        },
      },
    });

    const tableList = tables.map((t) => {
      const activeOrders = t.orders.length;
      const uniqueCustomerIds = new Set(t.orders.map((o) => o.customerId));
      const activeCustomers = uniqueCustomerIds.size;

      return {
        id: t.id,
        tableNumber: t.tableNumber,
        qrCodeUrl: t.qrCodeUrl || `/table/${t.tableNumber}`,
        active: t.active,
        activeCustomers,
        activeOrders,
        orders: t.orders,
      };
    });

    return res.json({ success: true, tables: tableList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function addTable(req: AuthenticatedRequest, res: Response) {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber || isNaN(Number(tableNumber))) {
      return res.status(400).json({ success: false, message: 'Valid table number is required' });
    }

    const num = Number(tableNumber);
    const existing = await prisma.table.findUnique({ where: { tableNumber: num } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Table ${num} already exists` });
    }

    const table = await prisma.table.create({
      data: {
        tableNumber: num,
        qrCodeUrl: `/table/${num}`,
        active: true,
      },
    });

    if (req.admin) {
      await logActivity('TABLE_ADD', `Added Table ${num}`, req.admin.email, req.ip);
    }

    return res.status(201).json({ success: true, table });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTable(req: AuthenticatedRequest, res: Response) {
  try {
    const tableId = String(req.params.id);
    const { tableNumber, active } = req.body;

    const existing = await prisma.table.findUnique({ where: { id: tableId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Table not found' });

    const num = tableNumber ? Number(tableNumber) : existing.tableNumber;

    if (tableNumber && num !== existing.tableNumber) {
      const numTaken = await prisma.table.findUnique({ where: { tableNumber: num } });
      if (numTaken) {
        return res.status(400).json({ success: false, message: `Table ${num} already exists` });
      }
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: {
        tableNumber: num,
        qrCodeUrl: `/table/${num}`,
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    if (req.admin) {
      await logActivity('TABLE_EDIT', `Updated Table ${updated.tableNumber}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, table: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTable(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const tableId = String(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required to delete table' });
    }

    const isPasswordValid = await verifyAdminPassword(req.admin.id, String(password));
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    await prisma.table.delete({ where: { id: tableId } });

    await logActivity('TABLE_DELETE', `Deleted Table ${table.tableNumber}`, req.admin.email, req.ip);

    return res.json({ success: true, message: `Table ${table.tableNumber} deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
