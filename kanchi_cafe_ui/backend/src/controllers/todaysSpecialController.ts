import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function getTodaysSpecials(req: Request, res: Response) {
  try {
    const specials = await prisma.todaysSpecial.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, specials });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTodaysSpecial(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, price, description, imageUrl, isAvailable, sortOrder } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const special = await prisma.todaysSpecial.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
        description: description ? String(description).trim() : null,
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    if (req.admin) {
      await logActivity('TODAYS_SPECIAL_CREATE', `Created independent Today's Special: ${special.name}`, req.admin.email, req.ip);
    }

    return res.status(201).json({ success: true, special });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTodaysSpecial(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const { name, price, description, imageUrl, isAvailable, sortOrder } = req.body;

    const special = await prisma.todaysSpecial.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    if (req.admin) {
      await logActivity('TODAYS_SPECIAL_UPDATE', `Updated Today's Special: ${special.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, special });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTodaysSpecial(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const special = await prisma.todaysSpecial.delete({ where: { id } });

    if (req.admin) {
      await logActivity('TODAYS_SPECIAL_DELETE', `Deleted Today's Special: ${special.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, message: "Today's Special deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleTodaysSpecialAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.todaysSpecial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Today's Special not found" });

    const updated = await prisma.todaysSpecial.update({
      where: { id },
      data: { isAvailable: !existing.isAvailable },
    });

    return res.json({ success: true, special: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
