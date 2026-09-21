import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './service';
import { CreatePaymentOrderSchema } from '@triveni/shared-validation';
import { z } from 'zod';
import { PaymentType } from '@triveni/shared-types';

export class PaymentController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const data = CreatePaymentOrderSchema.parse(req.body);
      
      const order = await PaymentService.createOrder(data.bookingId, data.type as PaymentType, customerId);
      res.status(201).json(order);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Razorpay sends signature in this header
      const signature = req.headers['x-razorpay-signature'] as string;
      
      // Webhook payload is typically verified against raw body, but assuming JSON body parser for now
      // Note: In production, you need the raw unparsed body for accurate HMAC signature checking.
      await PaymentService.verifyWebhook(req.body, signature || '');
      
      res.status(200).send('OK');
    } catch (e) {
      console.error('Webhook processing error', e);
      // Always return 200 to razorpay unless it's a fatal retryable error, to stop retries on bad data
      res.status(200).send('Processed with errors');
    }
  }
}
