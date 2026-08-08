import { Response } from 'express';
import { AuthenticatedRequest, verifyAdminPassword } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function getActivityLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { fromDate, toDate, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (fromDate && toDate) {
      const start = new Date(String(fromDate));
      const end = new Date(String(toDate));
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
      logs,
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function purgeData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { targetEntity, fromDate, toDate, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required for data purge' });
    }

    const isValid = await verifyAdminPassword(req.admin.id, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    if (!targetEntity) {
      return res.status(400).json({ success: false, message: 'Target entity is required' });
    }

    const whereDate: any = {};
    if (fromDate && toDate) {
      const start = new Date(String(fromDate));
      const end = new Date(String(toDate));
      end.setHours(23, 59, 59, 999);
      whereDate.createdAt = { gte: start, lte: end };
    }

    let deletedCount = 0;

    switch (targetEntity) {
      case 'ORDERS':
        const resOrders = await prisma.order.deleteMany({ where: whereDate });
        deletedCount = resOrders.count;
        break;
      case 'REVIEWS':
        const resReviews = await prisma.review.deleteMany({ where: whereDate });
        deletedCount = resReviews.count;
        break;
      case 'ACTIVITY_LOGS':
        const resLogs = await prisma.activityLog.deleteMany({ where: whereDate });
        deletedCount = resLogs.count;
        break;
      case 'CUSTOMERS':
        const resCustomers = await prisma.customer.deleteMany({ where: whereDate });
        deletedCount = resCustomers.count;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid target entity' });
    }

    await logActivity('DATA_PURGE', `Purged ${deletedCount} records from ${targetEntity}`, req.admin.email, req.ip);

    return res.json({
      success: true,
      message: targetEntity === 'ORDERS'
        ? `Successfully deleted ${deletedCount} records from ORDERS`
        : `Successfully purged ${deletedCount} records from ${targetEntity}`,
      deletedCount,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
