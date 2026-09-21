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
}
