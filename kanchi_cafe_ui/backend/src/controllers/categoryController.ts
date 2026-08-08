import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    if (req.admin) {
      await logActivity('CATEGORY_CREATE', `Created category: ${category.name}`, req.admin.email, req.ip);
    }

    return res.status(201).json({ success: true, category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const categoryId = String(req.params.id);
    const { name, sortOrder, active } = req.body;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    if (req.admin) {
      await logActivity('CATEGORY_UPDATE', `Updated category: ${category.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const categoryId = String(req.params.id);
    const category = await prisma.category.delete({ where: { id: categoryId } });

    if (req.admin) {
      await logActivity('CATEGORY_DELETE', `Deleted category: ${category.name}`, req.admin.email, req.ip);
    }

    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
