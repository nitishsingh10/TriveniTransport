import { Router } from 'express';
import { PaymentController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

// Customer creates an order (support both /create-order and /order for SDK/client compatibility)
router.post('/create-order', authGuard, requireRole('customer'), PaymentController.createOrder);
router.post('/order', authGuard, requireRole('customer'), PaymentController.createOrder);

// Webhook endpoint from Razorpay (signature verified in controller/service)
router.post('/webhook', PaymentController.webhook);

export default router;
