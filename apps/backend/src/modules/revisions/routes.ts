import { Router } from 'express';
import { RevisionController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);

// Vendor proposes revision
router.post('/bookings/:bookingId', requireRole('vendor'), RevisionController.propose);

// Customer actions
router.post('/:id/approve', requireRole('customer'), RevisionController.approve);
router.post('/:id/decline', requireRole('customer'), RevisionController.decline);

export default router;
