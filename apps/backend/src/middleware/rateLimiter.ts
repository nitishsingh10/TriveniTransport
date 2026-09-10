import rateLimit from 'express-rate-limit';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedis } from '../config/redis';
import { getEnv } from '../config/env';

// Memory fallback if Redis fails (optional, but standard rateLimit works well for simple things)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins by default
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OTP requests, please try again later.',
    },
  },
});

// For more advanced Redis-backed rate limiting (per phone number)
export function createPhoneRateLimiter() {
  const { OTP_RATE_LIMIT_MAX, OTP_RATE_LIMIT_WINDOW_MINUTES } = getEnv();
  
  return new RateLimiterRedis({
    storeClient: getRedis(),
    keyPrefix: 'rl:otp',
    points: OTP_RATE_LIMIT_MAX,
    duration: OTP_RATE_LIMIT_WINDOW_MINUTES * 60, 
  });
}
