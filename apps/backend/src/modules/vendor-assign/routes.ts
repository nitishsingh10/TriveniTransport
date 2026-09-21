import { Router } from 'express';
import { VendorController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);

// Vendor endpoints
router.get('/jobs', requireRole('vendor'), VendorController.getJobs);
router.patch('/jobs/:id/status', requireRole('vendor'), VendorController.updateStatus);

// Admin / Webhook endpoints
router.post('/auto-assign/:id', requireRole('admin'), VendorController.autoAssign);

export default router;
