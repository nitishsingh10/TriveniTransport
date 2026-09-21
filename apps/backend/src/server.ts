import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { getEnv, validateEnv } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Modules
import authRoutes from './modules/auth/routes';
import pricingRoutes from './modules/pricing/routes';
import bookingRoutes from './modules/booking/routes';
import vendorRoutes from './modules/vendor-assign/routes';
import revisionRoutes from './modules/revisions/routes';
import adminRoutes from './modules/admin/routes';
import paymentRoutes from './modules/payments/routes';

// Import background workers so they initialize
import './jobs/workers/invoiceWorker';
import './jobs/workers/notificationWorker';
import { setupWebsockets } from './websocket';
import { getRedis } from './config/redis';
import { prisma } from './config/prisma';

async function bootstrap() {
  // Validate env before doing anything
  const env = validateEnv();

  const app = express();
  const httpServer = createServer(app);

  // Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  setupWebsockets(io);

  // Security & standard middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  // Body parsers (stripe/razorpay webhooks need raw body, so we do it conditionally or before express.json if needed)
  app.use('/api/v1/webhooks/razorpay', express.raw({ type: 'application/json' }));
  app.use(express.json());

  // Healthcheck
  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await getRedis().ping();
      res.status(200).json({ status: 'ok' });
    } catch (e) {
      res.status(503).json({ status: 'error', message: 'Database/Redis connection failed' });
    }
  });

  // API Routes
  const router = express.Router();
  router.use('/auth', authRoutes);
  router.use('/quotes', pricingRoutes);
  router.use('/bookings', bookingRoutes);
  router.use('/vendor', vendorRoutes);
  router.use('/revisions', revisionRoutes); // often sub-routes of bookings, but can be top-level
  router.use('/admin', adminRoutes);
  router.use('/payments', paymentRoutes);
  
  app.use('/api/v1', router);

  // Error handling (must be last)
  app.use(errorHandler);

  // Start server
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${env.PORT}`);
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
