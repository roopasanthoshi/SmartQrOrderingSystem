import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

export interface AuthenticatedRequest extends Request {
  admin?: JwtPayload;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }

  req.admin = payload;
  next();
}

// Verify Admin Password for Sensitive Operations (Delete, Purge, Backup Restore)
export async function verifyAdminPassword(adminId: string, passwordAttempt: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) return false;
  return await bcrypt.compare(passwordAttempt, admin.passwordHash);
}
