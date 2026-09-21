import { Router } from 'express';
import { PaymentController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

// Customer creates an order
router.post('/create-order', authGuard, requireRole('customer'), PaymentController.createOrder);

// Webhook endpoint from Razorpay (no authGuard, verified via signature)
router.post('/webhook', PaymentController.webhook);

export default router;
