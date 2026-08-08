import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function getMenuItems(req: Request, res: Response) {
  try {
    const { categoryId, availableOnly } = req.query;

    const where: any = {};
    if (categoryId) where.categoryId = String(categoryId);
    if (availableOnly === 'true') where.isAvailable = true;

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: true,
      },
    });

    return res.json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable,
      isPopular,
      isCoffeeOrJuice,
      sortOrder,
    } = req.body;

    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({ success: false, message: 'Name, price, and categoryId are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        price: Number(price),
        categoryId: String(categoryId),
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
        isCoffeeOrJuice: isCoffeeOrJuice !== undefined ? Boolean(isCoffeeOrJuice) : false,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
      include: { category: true },
    });

    if (req.admin) {
      await logActivity('MENU_CREATE', `Created menu item: ${item.name}`, req.admin.email, req.ip);
    }

    return res.status(201).json({ success: true, item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const itemId = String(req.params.id);
    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable,
      isPopular,
      isCoffeeOrJuice,
      sortOrder,
    } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(categoryId && { categoryId: String(categoryId) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        ...(isCoffeeOrJuice !== undefined && { isCoffeeOrJuice: Boolean(isCoffeeOrJuice) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
      include: { category: true },
    });

    if (req.admin) {
      await logActivity('MENU_UPDATE', `Updated menu item: ${item.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const itemId = String(req.params.id);
    const item = await prisma.menuItem.delete({ where: { id: itemId } });

    if (req.admin) {
      await logActivity('MENU_DELETE', `Deleted menu item: ${item.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleMenuItemAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    const itemId = String(req.params.id);
    const existing = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Menu item not found' });

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !existing.isAvailable },
    });

    if (req.admin) {
      await logActivity('MENU_AVAILABILITY_TOGGLE', `Toggled ${updated.name} to ${updated.isAvailable}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, item: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
