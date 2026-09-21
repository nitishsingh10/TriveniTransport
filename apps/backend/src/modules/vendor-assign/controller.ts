import { Request, Response, NextFunction } from 'express';
import { VendorService } from './service';
import { UpdateJobStatusSchema } from '@triveni/shared-validation';
import { z } from 'zod';
import { BookingStatus } from '@triveni/shared-types';

export class VendorController {
  static async autoAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const result = await VendorService.autoAssign(bookingId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const dateStr = req.query.date as string | undefined;
      const jobs = await VendorService.getVendorJobs(vendorId, dateStr);
      res.status(200).json(jobs);
    } catch (e) {
      next(e);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const bookingId = req.params.id as string;
      const data = UpdateJobStatusSchema.parse(req.body);
      
      const result = await VendorService.updateJobStatus(vendorId, bookingId, data.status as BookingStatus);
      res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid status', details: e.errors });
      next(e);
    }
  }
}
