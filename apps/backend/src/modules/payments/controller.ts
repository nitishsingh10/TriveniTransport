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
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawPayload = (req as any).rawBody || req.body;
      
      await PaymentService.verifyWebhook(rawPayload, req.body, signature);
      
      res.status(200).send('OK');
    } catch (e) {
      console.error('Webhook processing error:', e);
      // Return 400 on signature failure or bad request so Razorpay can log or retry as appropriate
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
}
