/**
 * Environment configuration with Zod validation.
 * All env vars are validated at process startup — fail-fast, no mid-request surprises.
 */

import { z } from 'zod';

const EnvSchema = z.object({
  // ── Runtime ──────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((o) => o.trim())),

  // ── Database ─────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // ── Redis ─────────────────────────────────────────────────────
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  // ── JWT ──────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ── OTP ──────────────────────────────────────────────────────
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  // ── Razorpay ─────────────────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  // ── Advance payment percentage (0–100) ───────────────────────
  ADVANCE_PAYMENT_PERCENT: z.coerce.number().int().min(0).max(100).default(20),

  // ── Google Maps ──────────────────────────────────────────────
  GOOGLE_MAPS_API_KEY: z.string().min(1, 'GOOGLE_MAPS_API_KEY is required'),

  // ── MSG91 (WhatsApp + SMS) ────────────────────────────────────
  MSG91_API_KEY: z.string().min(1, 'MSG91_API_KEY is required'),
  MSG91_SENDER_ID: z.string().default('TRIVNI'),
  MSG91_WHATSAPP_NUMBER: z.string().min(10, 'MSG91_WHATSAPP_NUMBER is required'),

  // ── Expo Push ─────────────────────────────────────────────────
  EXPO_ACCESS_TOKEN: z.string().min(1, 'EXPO_ACCESS_TOKEN is required'),

  // ── Resend (Email) ───────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email().default('bookings@trivenipackers.com'),

  // ── Cloudinary (Invoice / Photos) ────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ── Admin ─────────────────────────────────────────────────────
  ADMIN_PHONE: z.string().min(10, 'ADMIN_PHONE is required — initial admin user phone number'),

  // ── Rate Limiting ─────────────────────────────────────────────
  OTP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  OTP_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
});

type Env = z.infer<typeof EnvSchema>;

let _env: Env;

export function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ✗ ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(
      `\n❌ Environment validation failed — fix the following before starting the server:\n${errors}\n`
    );
  }

  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    throw new Error('getEnv() called before validateEnv(). Call validateEnv() at server startup.');
  }
  return _env;
}

export type { Env };
