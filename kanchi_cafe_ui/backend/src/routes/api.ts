import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

import { requireAdmin } from '../middleware/auth';
import {
  loginAdmin,
  getAdminProfile,
  updateAdminCredentials,
  getCafeSettings,
  updateCafeSettings,
} from '../controllers/authController';
import { identifyCustomer, getCustomerProfile } from '../controllers/customerController';
import { getTables, addTable, updateTable, deleteTable } from '../controllers/tableController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from '../controllers/menuController';
import {
  getTodaysSpecials,
  createTodaysSpecial,
  updateTodaysSpecial,
  deleteTodaysSpecial,
  toggleTodaysSpecialAvailability,
} from '../controllers/todaysSpecialController';
import {
  createOrder,
  claimPaymentPaid,
  approvePayment,
  rejectPayment,
  getActiveOrders,
  getOrderHistory,
  confirmOrderCollection,
  deleteOrder,
} from '../controllers/orderController';
import { createReview, getReviews, replyToReview, deleteReview } from '../controllers/reviewController';
import { getReports, exportReportsExcel, getDashboardStats } from '../controllers/reportsController';
import { getActivityLogs, purgeData } from '../controllers/dataManagementController';
import { createBackup, getBackupList, restoreBackup } from '../controllers/backupController';
import { globalSearch } from '../controllers/searchController';
import { formatThermalKot } from '../services/kotPrinter';
import { prisma } from '../config/prisma';
import { downloadOrderInvoice } from '../controllers/invoiceController';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', loginAdmin);
router.get('/auth/me', requireAdmin, getAdminProfile);
router.put('/auth/credentials', requireAdmin, updateAdminCredentials);

// --- Settings & Branding Routes ---
router.get('/settings', getCafeSettings);
router.put('/settings', requireAdmin, updateCafeSettings);

// --- Customer Routes ---
router.post('/customer/identify', identifyCustomer);
router.get('/customer/profile/:mobile', getCustomerProfile);

// --- Tables Routes ---
router.get('/tables', getTables);
router.post('/tables', requireAdmin, addTable);
router.put('/tables/:id', requireAdmin, updateTable);
router.post('/tables/:id/delete', requireAdmin, deleteTable);

// --- Categories Routes ---
router.get('/categories', getCategories);
router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

// --- Menu Items Routes ---
router.get('/menu', getMenuItems);
router.post('/menu', requireAdmin, createMenuItem);
router.put('/menu/:id', requireAdmin, updateMenuItem);
router.patch('/menu/:id/toggle-availability', requireAdmin, toggleMenuItemAvailability);
router.delete('/menu/:id', requireAdmin, deleteMenuItem);

// --- Independent Today's Specials Routes ---
router.get('/todays-specials', getTodaysSpecials);
router.post('/todays-specials', requireAdmin, createTodaysSpecial);
router.put('/todays-specials/:id', requireAdmin, updateTodaysSpecial);
router.patch('/todays-specials/:id/toggle-availability', requireAdmin, toggleTodaysSpecialAvailability);
router.delete('/todays-specials/:id', requireAdmin, deleteTodaysSpecial);

// --- Orders & KOT Routes ---
router.post('/orders/create', createOrder);
router.post('/orders/:id/pay-claimed', claimPaymentPaid);
router.post('/orders/:id/approve', requireAdmin, approvePayment);
router.post('/orders/:id/reject', requireAdmin, rejectPayment);
router.get('/orders/active', getActiveOrders);
router.get('/orders/history', getOrderHistory);
router.post('/orders/:id/confirm-collection', confirmOrderCollection);
router.post('/orders/:id/delete', requireAdmin, deleteOrder);
router.get('/orders/:id/invoice', downloadOrderInvoice);

// Thermal Printing endpoints for KOT (Receipt printing REMOVED)
router.get('/orders/:id/kot-print', async (req, res) => {
  try {
    const orderId = String(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true, customer: true, items: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const kotNum = order.kotNumber || 'PENDING';

    const printer1Items = order.items
      .filter((i) => !i.isCoffeeOrJuice)
      .map((i) => ({ name: i.menuItemName, quantity: i.quantity, notes: i.notes }));

    const printer2Items = order.items
      .filter((i) => i.isCoffeeOrJuice)
      .map((i) => ({ name: i.menuItemName, quantity: i.quantity, notes: i.notes }));

    const printData = {
      kotNumber: kotNum,
      tableNumber: order.table.tableNumber,
      customerName: order.customer.name,
      customerMobile: order.customer.mobile,
      createdAt: order.createdAt,
      printer1Items,
      printer2Items,
    };

    const foodKotText = printer1Items.length > 0 ? formatThermalKot(printData, 'PRINTER_1') : null;
    const beverageKotText = printer2Items.length > 0 ? formatThermalKot(printData, 'PRINTER_2') : null;

    return res.json({
      success: true,
      kotNumber: kotNum,
      tableNumber: order.table.tableNumber,
      foodKotText,
      beverageKotText,
      hasFood: printer1Items.length > 0,
      hasBeverage: printer2Items.length > 0,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- Reviews Routes ---
router.get('/reviews', getReviews);
router.post('/reviews', createReview);
router.put('/reviews/:id/reply', requireAdmin, replyToReview);
router.post('/reviews/:id/delete', requireAdmin, deleteReview);

// --- Reports & Analytics Routes ---
router.get('/dashboard/stats', requireAdmin, getDashboardStats);
router.get('/reports/summary', getReports);
router.get('/reports/export-excel', exportReportsExcel);

// --- Data Management & Logs Routes ---
router.get('/activity-logs', requireAdmin, getActivityLogs);
router.post('/data-management/purge', requireAdmin, purgeData);

// --- Backup & Restore Routes ---
router.get('/backups', requireAdmin, getBackupList);
router.post('/backups/create', requireAdmin, createBackup);
router.post('/backups/restore', requireAdmin, restoreBackup);

// --- Global Search Route ---
router.get('/search', globalSearch);

// --- File Upload Setup & Routes ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const uploadToCloudinary = (fileBuffer: Buffer) => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'kanchi_cafe',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );
        Readable.from(fileBuffer).pipe(stream);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);
    return res.json({ success: true, imageUrl: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Cloudinary upload failed' });
  }
});

export default router;
