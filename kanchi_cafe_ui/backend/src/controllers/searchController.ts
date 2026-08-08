import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export async function globalSearch(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({
        success: true,
        results: { orders: [], customers: [], reviews: [], tables: [] },
      });
    }

    const query = q.trim();

    const [orders, customers, reviews, tables] = await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [
            { kotNumber: { contains: query, mode: 'insensitive' } },
            { paymentRef: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { customer: { mobile: { contains: query, mode: 'insensitive' } } },
          ],
        },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, table: true, items: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mobile: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 15,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.findMany({
        where: {
          OR: [
            { comment: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { customer: { mobile: { contains: query, mode: 'insensitive' } } },
          ],
        },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, order: true },
      }),
      prisma.table.findMany({
        where: isNaN(Number(query)) ? {} : { tableNumber: Number(query) },
        take: 10,
      }),
    ]);

    return res.json({
      success: true,
      query,
      results: {
        orders,
        customers,
        reviews,
        tables,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
