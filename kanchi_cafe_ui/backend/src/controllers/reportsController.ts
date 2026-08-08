import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import * as XLSX from 'xlsx';

export async function getReports(req: Request, res: Response) {
  try {
    const { fromDate, toDate, filterType = 'monthly' } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    if (fromDate && toDate) {
      startDate = new Date(String(fromDate));
      endDate = new Date(String(toDate));
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monthly by default
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const averageBill = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Unique customer visits
    const uniqueCustomerMobiles = new Set(orders.map((o) => o.customer.mobile));
    const totalCustomerVisits = uniqueCustomerMobiles.size;

    // Item Sales & Category Sales & Peak Hours calculation
    const itemSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const categorySalesMap: Record<string, number> = {};
    const hourSalesMap: Record<number, number> = {};

    for (let h = 0; h < 24; h++) hourSalesMap[h] = 0;

    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours();
      hourSalesMap[hour] = (hourSalesMap[hour] || 0) + 1;

      for (const item of order.items) {
        if (!itemSalesMap[item.menuItemName]) {
          itemSalesMap[item.menuItemName] = { name: item.menuItemName, quantity: 0, revenue: 0 };
        }
        itemSalesMap[item.menuItemName].quantity += item.quantity;
        itemSalesMap[item.menuItemName].revenue += item.unitPrice * item.quantity;
      }
    }

    const sortedItems = Object.values(itemSalesMap).sort((a, b) => b.quantity - a.quantity);
    const topSelling = sortedItems.slice(0, 5);
    const leastSelling = sortedItems.slice(-5).reverse();

    // Fetch categories for category sales rollup
    const categories = await prisma.category.findMany({ include: { items: true } });
    categories.forEach((cat) => {
      let catRev = 0;
      const catItemNames = new Set(cat.items.map((i) => i.name));
      orders.forEach((o) => {
        o.items.forEach((it) => {
          if (catItemNames.has(it.menuItemName)) {
            catRev += it.unitPrice * it.quantity;
          }
        });
      });
      categorySalesMap[cat.name] = catRev;
    });

    // Format peak hours data array
    const peakHours = Object.entries(hourSalesMap).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      orderCount: count,
    }));

    return res.json({
      success: true,
      filter: {
        filterType,
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString(),
      },
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        averageBill: Number(averageBill.toFixed(2)),
        totalCustomerVisits,
      },
      topSelling,
      leastSelling,
      categorySales: categorySalesMap,
      peakHours,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportReportsExcel(req: Request, res: Response) {
  try {
    const { fromDate, toDate, filterType, exportType } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    if (fromDate && toDate) {
      startDate = new Date(String(fromDate));
      endDate = new Date(String(toDate));
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monthly by default
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        customer: true,
        items: true,
      },
    });

    const previousOrdersRows = orders.map((o) => ({
      'KOT Number': o.kotNumber || 'PENDING',
      'Order Date': new Date(o.createdAt).toLocaleDateString('en-IN'),
      'Order Time': new Date(o.createdAt).toLocaleTimeString('en-IN'),
      'Table Number': `Table ${o.table.tableNumber}`,
      'Customer Name': o.customer.name,
      'Customer Mobile': o.customer.mobile,
      'Ordered Items & Quantities': o.items.map((i) => `${i.menuItemName} (x${i.quantity})`).join(', '),
      'Subtotal (Rs.)': o.subtotal,
      'GST Amount (Rs.)': o.taxAmount,
      'Total Amount (Rs.)': o.totalAmount,
      'Payment Status': o.paymentStatus,
      'Order Status': o.status,
      'Payment Method': o.paymentMethod,
      'Payment Reference': o.paymentRef || 'N/A',
      'Payment Confirmation Time': o.paymentConfirmedAt ? new Date(o.paymentConfirmedAt).toLocaleString('en-IN') : 'N/A',
    }));

    // Group orders by date (YYYY-MM-DD local timezone context)
    const ordersByDate: Record<string, typeof orders> = {};
    for (const o of orders) {
      const date = new Date(o.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!ordersByDate[dateStr]) {
        ordersByDate[dateStr] = [];
      }
      ordersByDate[dateStr].push(o);
    }

    const categories = await prisma.category.findMany({ include: { items: true } });
    const categoryItemNames = categories.map((cat) => ({
      name: cat.name,
      itemNames: new Set(cat.items.map((i) => i.name)),
    }));

    const sortedDates = Object.keys(ordersByDate).sort().reverse(); // Newest first
    const revenueRows = sortedDates.map((dateStr) => {
      const dateOrders = ordersByDate[dateStr];
      const count = dateOrders.length;
      const subtotal = dateOrders.reduce((acc, o) => acc + o.subtotal, 0);
      const tax = dateOrders.reduce((acc, o) => acc + o.taxAmount, 0);
      const total = dateOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const avgValue = count > 0 ? total / count : 0;

      const row: any = {
        'Date': dateStr,
        'Orders Count': count,
        'Subtotal': Number(subtotal.toFixed(2)),
        'GST': Number(tax.toFixed(2)),
        'Total Revenue': Number(total.toFixed(2)),
        'Average Order Value': Number(avgValue.toFixed(2)),
      };

      // Add category revenue
      for (const cat of categoryItemNames) {
        let catRev = 0;
        for (const o of dateOrders) {
          for (const it of o.items) {
            if (cat.itemNames.has(it.menuItemName)) {
              catRev += it.unitPrice * it.quantity;
            }
          }
        }
        row[`${cat.name} Revenue`] = Number(catRev.toFixed(2));
      }

      return row;
    });

    const workbook = XLSX.utils.book_new();
    let filename = 'Kanchi_Cafe_Reports.xlsx';

    // Auto-fit column widths
    const fitToColumn = (rows: any[]) => {
      if (rows.length === 0) return [];
      const keys = Object.keys(rows[0]);
      return keys.map((key) => {
        let maxLen = key.length;
        for (const row of rows) {
          const val = row[key];
          const valStr = val !== undefined && val !== null ? String(val) : '';
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        }
        return { wch: maxLen + 3 };
      });
    };

    if (exportType === 'revenue') {
      const worksheet2 = XLSX.utils.json_to_sheet(revenueRows);
      worksheet2['!cols'] = fitToColumn(revenueRows);
      XLSX.utils.book_append_sheet(workbook, worksheet2, 'Revenue');
      filename = 'Kanchi_Cafe_Revenue.xlsx';
    } else {
      // Default to 'orders'
      const worksheet1 = XLSX.utils.json_to_sheet(previousOrdersRows);
      worksheet1['!cols'] = fitToColumn(previousOrdersRows);
      XLSX.utils.book_append_sheet(workbook, worksheet1, 'Previous Orders');
      filename = 'Kanchi_Cafe_Orders.xlsx';
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayRevenueAggregate,
      todayOrders,
      pendingApprovals,
      activeOrders,
      totalReviews,
      ratingAggregate,
      recentOrders,
      pendingPayments,
      recentReviews,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ['COMPLETED', 'ACTIVE'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ['COMPLETED', 'ACTIVE', 'PENDING_APPROVAL'] },
        },
      }),
      prisma.order.count({
        where: { paymentStatus: 'PENDING' },
      }),
      prisma.order.count({
        where: { status: { in: ['ACTIVE', 'PENDING_APPROVAL'] } },
      }),
      prisma.review.count(),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          table: true,
          customer: true,
          items: true,
        },
      }),
      prisma.order.findMany({
        where: { paymentStatus: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          table: true,
          customer: true,
          items: true,
        },
      }),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      stats: {
        todayOrders,
        todayRevenue: todayRevenueAggregate._sum.totalAmount || 0,
        pendingApprovals,
        activeOrders,
        totalReviews,
        avgRating: ratingAggregate._avg.rating || 5.0,
      },
      recentOrders,
      pendingPayments,
      recentReviews,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
