import rateLimit from 'express-rate-limit';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedis } from '../config/redis';
import { getEnv } from '../config/env';

// ── Global API limiter (protects entire API surface from flood attacks) ────
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});

// ── Strict OTP rate limiter per IP ──────────────────────────────────────────
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OTP requests from this network. Please wait 15 minutes.',
    },
  },
});

// ── Quotes rate limiter (prevents price scraping / compute exhaustion) ──────
export const quoteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 quote calculations per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Quote request rate limit reached. Please wait a few minutes.',
    },
  },
});

// ── Maps / Places rate limiter (protects external Google Maps API quota) ────
export const mapsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 autocomplete/distance lookups per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Map search rate limit exceeded. Please wait a moment.',
    },
  },
});

// ── Phone number-based rate limiting (prevents SMS bombing on a single number) ─
let phoneLimiter: RateLimiterRedis | null = null;

function getPhoneLimiter(): RateLimiterRedis {
  if (!phoneLimiter) {
    const { OTP_RATE_LIMIT_MAX, OTP_RATE_LIMIT_WINDOW_MINUTES } = getEnv();
    phoneLimiter = new RateLimiterRedis({
      storeClient: getRedis(),
      keyPrefix: 'rl:otp:phone',
      points: OTP_RATE_LIMIT_MAX,
      duration: OTP_RATE_LIMIT_WINDOW_MINUTES * 60,
    });
  }
  return phoneLimiter;
}

export async function checkPhoneOtpLimit(phone: string): Promise<void> {
  try {
    const limiter = getPhoneLimiter();
    await limiter.consume(phone);
  } catch (err: any) {
    if (err && err.remainingPoints === 0) {
      throw {
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many OTP requests for this phone number. Please try again later.',
      };
    }
    // Fail-open on unexpected Redis errors so users aren't locked out during transient infra issues
    console.warn('Phone rate limiter warning (failing open):', err);
  }
}
