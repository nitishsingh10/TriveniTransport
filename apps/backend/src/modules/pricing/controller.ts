import { Request, Response, NextFunction } from 'express';
import { PricingService } from './service';
import { InstantEstimateSchema, ItemizedQuoteSchema } from '@triveni/shared-validation';
import { z } from 'zod';

export class PricingController {
  static async instantEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = InstantEstimateSchema.parse(req.body);
      const estimate = await PricingService.getInstantEstimate(data);
      res.status(200).json(estimate);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      }
      next(e);
    }
  }

  static async itemizedQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ItemizedQuoteSchema.parse(req.body);
      
      // Optionally attach user ID if authenticated
      const customerId = req.user?.role === 'customer' ? req.user.id : undefined;
      
      const quote = await PricingService.calculateItemizedQuote(data, customerId);
      res.status(200).json(quote);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      }
      next(e);
    }
  }
}
