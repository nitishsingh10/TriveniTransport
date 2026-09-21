import { Router } from 'express';
import { AdminController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

// Protect all admin routes
router.use(authGuard);
router.use(requireRole('admin'));

// Metrics
router.get('/metrics', AdminController.getMetrics);

// Configuration (Pricing & Zones)
router.post('/zones', AdminController.createZone);
router.post('/zone-rates', AdminController.createZoneRate);
router.post('/items', AdminController.createItem);
router.post('/pricing-rules', AdminController.createPricingRule);

export default router;
