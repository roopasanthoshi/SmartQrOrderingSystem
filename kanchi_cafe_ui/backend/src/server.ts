import dotenv from 'dotenv';
import { app } from './app';
import { prisma, connectAndVerifyDatabase } from './config/prisma';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Prevent unexpected process terminations from unhandled rejections or socket aborts
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection intercepted:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception intercepted:', error);
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
    console.warn('⚠️ Initial Neon PostgreSQL connection check timed out. Server starting anyway (requests will retry on demand)...');
  } else {
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
  }

  // 4. Start Listening
  app.listen(PORT, () => {
    console.log('✓ Server Running');
    console.log(`🚀 Kanchi Cafe Backend Server running on port ${PORT}`);
    console.log('--------------------------------------------------');
  });
}

startServer();
