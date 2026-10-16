import { Router } from 'express';
import { BookingController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

// All booking endpoints require at least customer auth
router.use(authGuard);

router.post('/', requireRole('customer'), BookingController.createDraft);
router.post('/:id/hold', requireRole('customer'), BookingController.holdSlot);
router.post('/:id/cancel', requireRole('customer'), BookingController.cancel);

// Webhook confirms bookings; manual confirmation restricted to admin
router.post('/:id/confirm', requireRole('admin'), BookingController.confirm);

router.get('/', requireRole('customer'), BookingController.listBookings);
router.get('/:id', requireRole('customer'), BookingController.getDetails);
router.get('/:id/telemetry', requireRole('customer'), BookingController.getTelemetry);

export default router;

