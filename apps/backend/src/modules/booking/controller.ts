import { Request, Response, NextFunction } from 'express';
import { BookingService } from './service';
import { ItemizedQuoteSchema } from '@triveni/shared-validation';
import { z } from 'zod';

export class BookingController {
  static async createDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const data = ItemizedQuoteSchema.parse(req.body);
      const result = await BookingService.createDraftBooking(customerId, data);
      res.status(201).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async holdSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const bookingId = req.params.id as string;
      const result = await BookingService.holdSlot(bookingId, customerId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      // In a real app, this is called by Razorpay webhook, not directly by user API
      const result = await BookingService.confirmBooking(bookingId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const bookingId = req.params.id as string;
      const result = await BookingService.cancelBooking(bookingId, customerId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const list = await BookingService.listBookings(customerId);
      res.status(200).json(list);
    } catch (e) {
      next(e);
    }
  }

  static async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const bookingId = req.params.id as string;
      const details = await BookingService.getBookingDetails(bookingId, customerId);
      res.status(200).json(details);
    } catch (e) {
      next(e);
    }
  }
}
