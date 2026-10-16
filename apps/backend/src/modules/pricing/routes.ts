import { Router } from 'express';
import { PricingController } from './controller';
import { quoteRateLimiter } from '../../middleware/rateLimiter';
import { authGuard } from '../../middleware/authGuard';

const router: Router = Router();

// Layer-1 Instant Estimate (Public, rate limited)
router.post('/instant-estimate', quoteRateLimiter, PricingController.instantEstimate);

// Layer-2 Itemized Quote (Requires Auth, typically Customer)
// In some flows, guests might be able to quote before authenticating,
// but per spec, they sign up/login first for itemized quotes.
router.post('/itemized', authGuard, quoteRateLimiter, PricingController.itemizedQuote);

export default router;
