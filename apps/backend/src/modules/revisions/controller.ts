import { Request, Response, NextFunction } from 'express';
import { RevisionService } from './service';
import { CreateRevisionSchema } from '@triveni/shared-validation';
import { z } from 'zod';

export class RevisionController {
  static async propose(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const bookingId = req.params.bookingId as string;
      const data = CreateRevisionSchema.parse(req.body);
      
      const result = await RevisionService.createRevision(bookingId, vendorId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const revisionId = req.params.id as string;
      const result = await RevisionService.approveRevision(revisionId, customerId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const revisionId = req.params.id as string;
      const result = await RevisionService.declineRevision(revisionId, customerId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}
