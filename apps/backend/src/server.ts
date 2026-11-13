import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { getEnv } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';

// Modules
import authRoutes from './modules/auth/routes';
import pricingRoutes from './modules/pricing/routes';
import bookingRoutes from './modules/booking/routes';
import vendorRoutes from './modules/vendor-assign/routes';
import revisionRoutes from './modules/revisions/routes';
import adminRoutes from './modules/admin/routes';
import paymentRoutes from './modules/payments/routes';
import customerRoutes from './modules/customer/routes';
import mapsRoutes from './modules/geocoding/routes';

// Import background workers so they initialize
import './jobs/workers/invoiceWorker';
import './jobs/workers/notificationWorker';
import { setupWebsockets } from './websocket';
import { getRedis } from './config/redis';
import { prisma } from './config/prisma';

async function bootstrap() {
  const env = getEnv();

  // Eagerly connect Redis and Prisma on startup so first requests are instant
  getRedis();
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err: any) {
    console.error('⚠️ Database connection warning on boot:', err.message);
  }

  const app = express();
  const httpServer = createServer(app);

  // Trust first proxy (Render, Cloudflare, AWS ALB) for accurate client IP rate limiting
  app.set('trust proxy', 1);

  const isAllowedOrigin = (origin: string | undefined): boolean => {
    // Allow requests with no origin (mobile apps, server-to-server, curl) or in development
    if (!origin || env.NODE_ENV === 'development') return true;
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    return env.CORS_ORIGINS.includes(cleanOrigin);
  };

  // Socket.io with origin restriction
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by Socket.io CORS policy'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  setupWebsockets(io);

  // Security headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  // Body parsers: preserve raw buffer for HMAC webhook validation, and enforce strict payload limits
  app.use(
    express.json({
      limit: '100kb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  //To test the server

  app.get('/', async (req, res) => {
    res.json({ message: 'Server is running' });
  });
  // Healthcheck (unmetered)
  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await getRedis().ping();
      res.status(200).json({ status: 'ok' });
    } catch (e) {
      res.status(503).json({ status: 'error', message: 'Database/Redis connection failed' });
    }
  });

  // Robots.txt: instruct crawlers not to index API endpoints
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });

  // Global rate limiter on all API routes
  app.use('/api/v1', globalRateLimiter);

  // API Routes
  const router = express.Router();
  router.use('/auth', authRoutes);
  router.use('/quotes', pricingRoutes);
  router.use('/bookings', bookingRoutes);
  router.use('/vendor', vendorRoutes);
  router.use('/customer', customerRoutes);
  router.use('/revisions', revisionRoutes);
  router.use('/admin', adminRoutes);
  router.use('/payments', paymentRoutes);
  router.use('/maps', mapsRoutes);

  app.use('/api/v1', router);
  // Also support root-level and /api paths for direct requests (e.g. /auth/otp/request)
  app.use('/api', globalRateLimiter, router);
  app.use(globalRateLimiter, router);

  // 404 Catch-All for unknown API routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Error handling (must be last)
  app.use(errorHandler);

  // Start server
  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${env.PORT}`);
    console.log(`🔌 Socket.io attached`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down securely...');
    httpServer.close();
    await prisma.$disconnect();
    await getRedis().quit();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
