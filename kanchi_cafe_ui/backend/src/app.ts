import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';
import { prisma } from './config/prisma';

dotenv.config();

const app = express();

const corsOriginEnv = process.env.CORS_ORIGIN;
const configuredOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map((o) => o.trim())
  : [];

// Flexible CORS setup: allows configured origins, all .vercel.app deployments, localhost, and server-to-server calls
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or serverless rewrites)
      if (!origin) return callback(null, true);

      if (
        !corsOriginEnv ||
        corsOriginEnv === '*' ||
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoints (available at both /health and /api/health)
app.get(['/health', '/api/health'], async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'OK', database: 'Connected', timestamp: new Date() });
  } catch (error: any) {
    return res.status(503).json({
      status: 'ERROR',
      message: 'Database connection offline',
      error: error?.message || 'DB Unavailable',
      timestamp: new Date(),
    });
  }
});

// Root welcome / status endpoint
app.get('/', (req: Request, res: Response) => {
  return res.json({
    status: 'OK',
    name: 'Kanchi Cafe POS Backend API Server',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      menu: '/api/menu',
      categories: '/api/categories',
      tables: '/api/tables',
      specials: '/api/todays-specials',
    },
  });
});

// Static files uploads (preserved for backward compatibility)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes with /api prefix and direct fallback for serverless rewrite compatibility
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Global Error Handler Middleware - Catches all Prisma / DB / Internal errors cleanly
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Server Error Intercepted:', err?.message || err);

  // Return clean JSON error without leaking stack traces or internal details
  return res.status(500).json({
    success: false,
    message: err?.message || 'Unable to connect to server. Please try again later.',
  });
});

export { app };
export default app;
