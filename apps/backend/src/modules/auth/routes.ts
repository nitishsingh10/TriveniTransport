import { Router } from 'express';
import { AuthController } from './controller';
import { otpRateLimiter, verifyOtpRateLimiter } from '../../middleware/rateLimiter';
import { authGuard } from '../../middleware/authGuard';

const router: Router = Router();

// Rate limited OTP routes
router.post('/otp/request', otpRateLimiter, AuthController.requestOtp);
router.post('/otp/verify', verifyOtpRateLimiter, AuthController.verifyOtp);

// Session management
router.post('/refresh', AuthController.refresh);
router.post('/logout', authGuard, AuthController.logout);

export default router;
