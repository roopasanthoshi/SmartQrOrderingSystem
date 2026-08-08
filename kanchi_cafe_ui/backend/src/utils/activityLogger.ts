import { prisma } from '../config/prisma';

export async function logActivity(action: string, details: string, adminEmail?: string, ipAddress?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        adminEmail: adminEmail || 'SYSTEM',
        ipAddress: ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}
