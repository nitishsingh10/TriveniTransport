import { Router } from 'express';
import { PricingController } from './controller';
import { otpRateLimiter } from '../../middleware/rateLimiter';
import { authGuard } from '../../middleware/authGuard';

const router: Router = Router();

// Layer-1 Instant Estimate (Public, rate limited)
router.post('/instant-estimate', otpRateLimiter, PricingController.instantEstimate);

// Layer-2 Itemized Quote (Requires Auth, typically Customer)
// In some flows, guests might be able to quote before authenticating,
// but per spec, they sign up/login first for itemized quotes.
router.post('/itemized', authGuard, otpRateLimiter, PricingController.itemizedQuote);

export default router;
