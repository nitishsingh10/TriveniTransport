import { Request, Response, NextFunction } from 'express';
import { AdminService } from './service';
import { CreateZoneSchema, CreateZoneRateSchema, CreateItemSchema, CreatePricingRuleSchema } from '@triveni/shared-validation';
import { z } from 'zod';

export class AdminController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceType = req.query.serviceType as 'packers_movers' | 'transport' | undefined;
      if (serviceType && !['packers_movers', 'transport'].includes(serviceType)) return res.status(400).json({ error: { message: 'Invalid service type.' } });
      const metrics = await AdminService.getMetrics(serviceType);
      res.status(200).json(metrics);
    } catch (e) {
      next(e);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const serviceType = req.query.serviceType as 'packers_movers' | 'transport' | undefined;
      if (serviceType && !['packers_movers', 'transport'].includes(serviceType)) return res.status(400).json({ error: { message: 'Invalid service type.' } });
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 50;

      const result = await AdminService.listBookings({ status, search, skip, take, serviceType });
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await AdminService.getBooking(req.params.id as string);
      res.status(200).json(booking);
    } catch (e) {
      next(e);
    }
  }

  static async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const bookingId = req.params.id as string;
      const schema = z.object({
        status: z.enum(['REQUESTED', 'QUOTED', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'REVISION_PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
        notes: z.string().trim().max(2000).optional(),
      });
      const { status, notes } = schema.parse(req.body);

      const updated = await AdminService.updateBookingStatus(adminId, bookingId, status, notes);
      res.status(200).json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Choose a valid booking status.', details: e.errors });
      next(e);
    }
  }

  static async assignBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const bookingId = req.params.id as string;
      const { vendorId, vehicleId } = req.body;

      if (!vendorId) {
        return res.status(400).json({ error: { message: 'vendorId is required' } });
      }

      const updated = await AdminService.assignBooking(adminId, bookingId, vendorId, vehicleId);
      res.status(200).json(updated);
    } catch (e) {
      next(e);
    }
  }

  static async listVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceType = req.query.serviceType as 'packers_movers' | 'transport' | undefined;
      if (serviceType && !['packers_movers', 'transport'].includes(serviceType)) return res.status(400).json({ error: { message: 'Invalid service type.' } });
      const vendors = await AdminService.listVendors(serviceType);
      res.status(200).json(vendors);
    } catch (e) {
      next(e);
    }
  }

  static async listVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceType = req.query.serviceType as 'packers_movers' | 'transport' | undefined;
      if (serviceType && !['packers_movers', 'transport'].includes(serviceType)) return res.status(400).json({ error: { message: 'Invalid service type.' } });
      const vehicles = await AdminService.listVehicles(serviceType);
      res.status(200).json(vehicles);
    } catch (e) {
      next(e);
    }
  }

  static async reviewVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        status: z.enum(['under_review', 'needs_changes', 'approved', 'rejected']),
        notes: z.string().trim().max(2000).optional(),
      });
      const { status, notes } = schema.parse(req.body);
      res.status(200).json(await AdminService.reviewVendor(req.user!.id, req.params.id as string, status, notes));
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid partner review action.', details: e.errors });
      next(e);
    }
  }

  static async listVendorDocuments(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await AdminService.listVendorDocuments(req.params.id as string)); } catch (e) { next(e); }
  }

  static async getVendorContract(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await AdminService.getVendorContract(req.params.id as string)); } catch (e) { next(e); }
  }

  static async reviewVendorDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ status: z.enum(['approved', 'rejected']), notes: z.string().trim().max(2000).optional() });
      const { status, notes } = schema.parse(req.body);
      res.status(200).json(await AdminService.reviewVendorDocument(req.user!.id, req.params.id as string, status, notes));
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid document review action.', details: e.errors });
      next(e);
    }
  }

  static async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await AdminService.listItems();
      res.status(200).json(items);
    } catch (e) {
      next(e);
    }
  }

  static async listPricingRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await AdminService.listPricingRules();
      res.status(200).json(rules);
    } catch (e) {
      next(e);
    }
  }

  static async listZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await AdminService.listZones();
      res.status(200).json(zones);
    } catch (e) {
      next(e);
    }
  }

  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 50;
      const logs = await AdminService.listAuditLogs(skip, take);
      res.status(200).json(logs);
    } catch (e) {
      next(e);
    }
  }

  static async createZone(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const data = CreateZoneSchema.parse(req.body);
      const result = await AdminService.createZone(adminId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async createZoneRate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const data = CreateZoneRateSchema.parse(req.body);
      const result = await AdminService.createZoneRate(adminId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const data = CreateItemSchema.parse(req.body);
      const result = await AdminService.createItem(adminId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async createPricingRule(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const data = CreatePricingRuleSchema.parse(req.body);
      const result = await AdminService.createPricingRule(adminId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 50;
      const logs = await AdminService.getNotifications(skip, take);
      res.status(200).json(logs);
    } catch (e) {
      next(e);
    }
  }

  static async retryNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.retryNotification(req.params.id as string);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}
