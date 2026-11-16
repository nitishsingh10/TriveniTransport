import { Router } from 'express';
import { AuthController } from './controller';
import { otpRateLimiter, verifyOtpRateLimiter } from '../../middleware/rateLimiter';

const router: Router = Router();

// Rate limited OTP routes
router.post('/otp/request', otpRateLimiter, AuthController.requestOtp);
router.post('/otp/verify', verifyOtpRateLimiter, AuthController.verifyOtp);

// Session management
router.post('/refresh', AuthController.refresh);
// Possession of a refresh token is enough to revoke that session, even after its access token expires.
router.post('/logout', AuthController.logout);

export default router;
