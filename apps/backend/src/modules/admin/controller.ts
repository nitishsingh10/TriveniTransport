import { Request, Response, NextFunction } from 'express';
import { AdminService } from './service';
import { CreateZoneSchema, CreateZoneRateSchema, CreateItemSchema, CreatePricingRuleSchema } from '@triveni/shared-validation';
import { z } from 'zod';

export class AdminController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AdminService.getMetrics();
      res.status(200).json(metrics);
    } catch (e) {
      next(e);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 50;

      const result = await AdminService.listBookings({ status, search, skip, take });
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
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: { message: 'status is required' } });
      }

      const updated = await AdminService.updateBookingStatus(adminId, bookingId, status, notes);
      res.status(200).json(updated);
    } catch (e) {
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
      const vendors = await AdminService.listVendors();
      res.status(200).json(vendors);
    } catch (e) {
      next(e);
    }
  }

  static async listVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = await AdminService.listVehicles();
      res.status(200).json(vehicles);
    } catch (e) {
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
