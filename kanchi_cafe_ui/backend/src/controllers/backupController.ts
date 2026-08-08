import { Response } from 'express';
import { AuthenticatedRequest, verifyAdminPassword } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function createBackup(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required to create a backup' });
    }

    const isValid = await verifyAdminPassword(req.admin.id, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    // Export all critical models
    const [
      cafeSettings,
      printerSettings,
      tables,
      categories,
      menuItems,
      customers,
      orders,
      reviews,
      activityLogs,
    ] = await Promise.all([
      prisma.cafeSettings.findMany(),
      prisma.printerSettings.findMany(),
      prisma.table.findMany(),
      prisma.category.findMany(),
      prisma.menuItem.findMany(),
      prisma.customer.findMany(),
      prisma.order.findMany({ include: { items: true } }),
      prisma.review.findMany(),
      prisma.activityLog.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      cafeSettings,
      printerSettings,
      tables,
      categories,
      menuItems,
      customers,
      orders,
      reviews,
      activityLogs,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `kanchi_cafe_backup_${Date.now()}.json`;
    const fileSize = `${(Buffer.byteLength(jsonString, 'utf-8') / 1024).toFixed(2)} KB`;

    const recordCounts = JSON.stringify({
      tables: tables.length,
      categories: categories.length,
      menuItems: menuItems.length,
      customers: customers.length,
      orders: orders.length,
      reviews: reviews.length,
    });

    const backupRecord = await prisma.backupHistory.create({
      data: {
        filename,
        fileSize,
        recordCounts,
      },
    });

    await logActivity('BACKUP_CREATE', `Created database backup ${filename}`, req.admin.email, req.ip);

    return res.json({
      success: true,
      message: 'Backup created successfully',
      backup: backupRecord,
      data: backupData,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBackupList(req: AuthenticatedRequest, res: Response) {
  try {
    const backups = await prisma.backupHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, backups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function restoreBackup(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { backupData, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required to restore backup' });
    }

    const isValid = await verifyAdminPassword(req.admin.id, password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    if (!backupData || !backupData.categories || !backupData.menuItems) {
      return res.status(400).json({ success: false, message: 'Invalid backup file structure' });
    }

    // Process restore inside transaction
    await prisma.$transaction(
      async (tx) => {
        // Restore Categories
        for (const cat of backupData.categories) {
          await tx.category.upsert({
            where: { id: cat.id },
            update: { name: cat.name, sortOrder: cat.sortOrder, active: cat.active },
            create: { id: cat.id, name: cat.name, sortOrder: cat.sortOrder, active: cat.active },
          });
        }

        // Restore Menu Items
        for (const item of backupData.menuItems) {
          await tx.menuItem.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              description: item.description,
              price: item.price,
              categoryId: item.categoryId,
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable,
              isPopular: item.isPopular,
              isCoffeeOrJuice: item.isCoffeeOrJuice,
              sortOrder: item.sortOrder,
            },
            create: {
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              categoryId: item.categoryId,
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable,
              isPopular: item.isPopular,
              isCoffeeOrJuice: item.isCoffeeOrJuice,
              sortOrder: item.sortOrder,
            },
          });
        }
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );

    await logActivity('BACKUP_RESTORE', 'Restored database snapshot from backup file', req.admin.email, req.ip);

    return res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
