import { Router } from 'express';
import { VendorController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);

// Vendor endpoints
router.get('/profile', requireRole('vendor'), VendorController.getProfile);
router.get('/vehicles', requireRole('vendor'), VendorController.getVehicles);
router.post('/onboarding', requireRole('vendor'), VendorController.saveOnboarding);
router.get('/jobs', requireRole('vendor'), VendorController.getJobs);
router.post('/jobs/:id/accept', requireRole('vendor'), VendorController.acceptJob);
router.patch('/jobs/:id/status', requireRole('vendor'), VendorController.updateStatus);
router.post('/jobs/:id/telemetry', requireRole('vendor'), VendorController.pushTelemetry);

// Admin / Webhook endpoints
router.post('/auto-assign/:id', requireRole('admin'), VendorController.autoAssign);

export default router;
