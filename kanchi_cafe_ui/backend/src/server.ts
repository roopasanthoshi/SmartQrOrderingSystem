import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';
import { prisma, connectAndVerifyDatabase } from './config/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'OK', database: 'Connected', timestamp: new Date() });
  } catch (error) {
    return res.status(503).json({ status: 'ERROR', message: 'Database connection offline' });
  }
});

// Static files uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler Middleware - Catches all Prisma / DB / Internal errors cleanly
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Server Error Intercepted:', err?.message || err);

  // Return clean JSON error without leaking stack traces or 500 internal details
  return res.status(500).json({
    success: false,
    message: 'Unable to connect to server. Please try again later.',
  });
});

async function startServer() {
  console.log('--------------------------------------------------');
  console.log('🚀 Initializing Kanchi Cafe POS Backend Server...');

  // 1. Verify Environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL missing from environment!');
    process.exit(1);
  }
  console.log('✓ Environment Loaded');
  console.log('✓ DATABASE_URL Loaded');

  // 2. Verify Database Connection
  const isConnected = await connectAndVerifyDatabase();
  if (!isConnected) {
    console.error('❌ Failed to connect to Neon PostgreSQL database after retries.');
    process.exit(1);
  }
  console.log('✓ Connected to Neon PostgreSQL');
  console.log('✓ Prisma Ready');

  // 3. Verify Admin, Settings, Categories & Menu
  try {
    const adminCount = await prisma.adminUser.count();
    if (adminCount > 0) console.log('✓ Admin Verified');

    const settings = await prisma.cafeSettings.findFirst();
    if (settings) console.log('✓ Cafe Settings Verified');

    const catCount = await prisma.category.count();
    if (catCount > 0) console.log('✓ Categories Verified');

    const menuCount = await prisma.menuItem.count();
    if (menuCount > 0) console.log('✓ Menu Verified');
  } catch (e: any) {
    console.warn('⚠️ Verification warning:', e.message);
  }

  // 4. Start Listening
  app.listen(PORT, () => {
    console.log('✓ Server Running');
    console.log(`🚀 Kanchi Cafe Backend Server running on port ${PORT}`);
    console.log('--------------------------------------------------');
  });
}

startServer();
