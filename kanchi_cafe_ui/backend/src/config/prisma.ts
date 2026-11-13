import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory, parent directory, and backend directory for complete environment resilience
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

declare global {
  var prisma: PrismaClient | undefined;
}

const rawDbUrl = process.env.DATABASE_URL;
const dbOptions: any = {
  log: ['error', 'warn'],
};

if (rawDbUrl) {
  // Automatically strip channel_binding=require if present, as Prisma does not support SCRAM channel binding on Neon
  let sanitizedUrl = rawDbUrl
    .replace(/&channel_binding=require/g, '')
    .replace(/channel_binding=require&/g, '')
    .replace(/\?channel_binding=require/g, '?');

  if (sanitizedUrl.endsWith('?')) {
    sanitizedUrl = sanitizedUrl.slice(0, -1);
  }

  // Ensure Neon serverless pooler timeouts are reasonable if not already specified
  if (!sanitizedUrl.includes('connect_timeout')) {
    sanitizedUrl += (sanitizedUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
  }
  if (!sanitizedUrl.includes('pool_timeout')) {
    sanitizedUrl += '&pool_timeout=30';
  }

  dbOptions.datasources = {
    db: {
      url: sanitizedUrl,
    },
  };
}

export const prisma =
  global.prisma ||
  new PrismaClient(dbOptions);

// Cache on global in all environments to prevent connection exhaustion in serverless & dev
global.prisma = prisma;

export async function connectAndVerifyDatabase(): Promise<boolean> {
  let retries = 3;
  while (retries > 0) {
    try {
      await prisma.$connect();
      // Execute a lightweight query to ensure active connection
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Prisma DB Connection attempt failed (${retries} retries left):`, err.message);
      retries -= 1;
      if (retries === 0) return false;
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  return false;
}
