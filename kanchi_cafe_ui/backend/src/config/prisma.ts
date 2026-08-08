import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectAndVerifyDatabase(): Promise<boolean> {
  let retries = 5;
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
