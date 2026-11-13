import { Router } from 'express';
import { CustomerController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);
router.use(requireRole('customer'));

router.get('/me', CustomerController.getMe);
router.patch('/me', CustomerController.updateProfile);
router.patch('/me/preferences', CustomerController.updatePreferences);

export default router;
