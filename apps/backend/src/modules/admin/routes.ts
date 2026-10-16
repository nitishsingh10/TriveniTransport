import { Router } from 'express';
import { AdminController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { requireRole } from '../../middleware/rbacGuard';

const router: Router = Router();

// Protect all admin routes
router.use(authGuard);
router.use(requireRole('admin'));

// Metrics & Analytics
router.get('/metrics', AdminController.getMetrics);

// Bookings Operations
router.get('/bookings', AdminController.listBookings);
router.get('/bookings/:id', AdminController.getBooking);
router.patch('/bookings/:id/status', AdminController.updateBookingStatus);
router.post('/bookings/:id/assign', AdminController.assignBooking);

// Fleet & Drivers
router.get('/vendors', AdminController.listVendors);
router.get('/vehicles', AdminController.listVehicles);

// Catalog & Rules
router.get('/items', AdminController.listItems);
router.post('/items', AdminController.createItem);
router.get('/pricing-rules', AdminController.listPricingRules);
router.post('/pricing-rules', AdminController.createPricingRule);
router.get('/zones', AdminController.listZones);
router.post('/zones', AdminController.createZone);
router.post('/zone-rates', AdminController.createZoneRate);

// Audit & Notifications
router.get('/audit-logs', AdminController.listAuditLogs);
router.get('/notifications', AdminController.getNotifications);
router.post('/notifications/:id/retry', AdminController.retryNotification);

export default router;
