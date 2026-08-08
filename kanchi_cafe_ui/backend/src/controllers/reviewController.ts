import { Request, Response } from 'express';
import { AuthenticatedRequest, verifyAdminPassword } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logActivity } from '../utils/activityLogger';

export async function createReview(req: Request, res: Response) {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'OrderId and a rating between 1 and 5 are required' });
    }

    const order = await prisma.order.findUnique({ where: { id: String(orderId) } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const existingReview = await prisma.review.findUnique({ where: { orderId: String(orderId) } });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'A review has already been submitted for this order' });
    }

    const review = await prisma.review.create({
      data: {
        orderId: String(orderId),
        customerId: order.customerId,
        rating: Number(rating),
        comment: comment ? String(comment).trim() : null,
      },
      include: {
        customer: true,
        order: { select: { kotNumber: true, createdAt: true } },
      },
    });

    return res.status(201).json({ success: true, review });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getReviews(req: Request, res: Response) {
  try {
    const { rating, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (rating) where.rating = Number(rating);

    if (search) {
      const term = String(search).trim();
      where.OR = [
        { comment: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { mobile: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          order: {
            select: { kotNumber: true, totalAmount: true, createdAt: true },
          },
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
      reviews,
      data: reviews,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function replyToReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const reviewId = String(req.params.id);
    const { adminReply } = req.body;

    if (!adminReply || !String(adminReply).trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { adminReply: String(adminReply).trim() },
      include: { customer: true, order: true },
    });

    await logActivity('REVIEW_REPLY', `Replied to review for ${review.order.kotNumber}`, req.admin.email, req.ip);

    return res.json({ success: true, message: 'Reply added successfully', review });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const reviewId = String(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required to delete a review' });
    }

    const isPasswordValid = await verifyAdminPassword(req.admin.id, String(password));
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { order: true } });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    await prisma.review.delete({ where: { id: reviewId } });

    await logActivity('REVIEW_DELETE', `Deleted review for ${review.order.kotNumber}`, req.admin.email, req.ip);

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
