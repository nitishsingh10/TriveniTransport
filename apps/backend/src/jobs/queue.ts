import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { getEnv } from '../config/env';

const { REDIS_URL } = getEnv();

// Re-use connection for queues to prevent connection leaks
export const redisConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// Define Queues
export const notificationsQueue = new Queue('notifications', { connection: redisConnection });
export const invoiceQueue = new Queue('invoice-generation', { connection: redisConnection });

// Enqueue helpers
export const enqueueNotification = async (jobName: string, data: any) => {
  return notificationsQueue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
};

export const enqueueInvoiceGeneration = async (bookingId: string) => {
  return invoiceQueue.add('generate', { bookingId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
};
