import { Router } from 'express';
import { CustomerController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);
router.use(requireRole('customer'));

router.get('/me', CustomerController.getMe);
router.patch('/me', CustomerController.updateProfile);
router.post('/me/phone/otp/request', CustomerController.requestPhoneChangeOtp);
router.post('/me/phone/otp/verify', CustomerController.verifyPhoneChangeOtp);
router.get('/me/addresses', CustomerController.getAddresses);
router.post('/me/addresses', CustomerController.saveAddress);
router.delete('/me/addresses/:addressId', CustomerController.deleteAddress);
router.patch('/me/preferences', CustomerController.updatePreferences);

// Also alias /profile for consistency with /vendor/profile
router.get('/profile', CustomerController.getMe);
router.patch('/profile', CustomerController.updateProfile);

export default router;
