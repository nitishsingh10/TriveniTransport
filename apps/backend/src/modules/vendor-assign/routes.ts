import { Router } from 'express';
import { VendorController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

router.use(authGuard);

// Vendor endpoints
router.get('/profile', requireRole('vendor'), VendorController.getProfile);
router.get('/partner-contract', requireRole('vendor'), VendorController.getPartnerContract);
router.post('/partner-contract/otp', requireRole('vendor'), VendorController.requestPartnerContractOtp);
router.post('/partner-contract/sign', requireRole('vendor'), VendorController.signPartnerContract);
router.get('/vehicles', requireRole('vendor'), VendorController.getVehicles);
router.post('/onboarding', requireRole('vendor'), VendorController.saveOnboarding);
router.post('/documents/presign', requireRole('vendor'), VendorController.createDocumentUploadUrl);
router.post('/documents/complete', requireRole('vendor'), VendorController.completeDocumentUpload);
router.get('/supervisors', requireRole('vendor'), VendorController.getSupervisors);
router.post('/supervisors', requireRole('vendor'), VendorController.addSupervisor);
router.patch('/supervisors/:id/revoke', requireRole('vendor'), VendorController.revokeSupervisor);
router.post('/bookings/:id/supervisor', requireRole('vendor'), VendorController.assignSupervisor);
router.get('/supervisor/jobs', requireRole('supervisor'), VendorController.getSupervisorJobs);
router.patch('/supervisor/jobs/:id/status', requireRole('supervisor'), VendorController.updateSupervisorStatus);
router.patch('/push-token', requireRole('vendor'), VendorController.updatePushToken);
router.get('/jobs', requireRole('vendor'), VendorController.getJobs);
router.post('/jobs/:id/accept', requireRole('vendor'), VendorController.acceptJob);
router.patch('/jobs/:id/status', requireRole('vendor'), VendorController.updateStatus);
router.post('/jobs/:id/telemetry', requireRole('vendor'), VendorController.pushTelemetry);

// Admin / Webhook endpoints
router.post('/auto-assign/:id', requireRole('admin'), VendorController.autoAssign);

export default router;
