import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { z } from 'zod';

const UpdatePreferencesSchema = z.object({
  whatsappOptIn: z.boolean().optional(),
  pushToken: z.string().nullable().optional(),
});

export class CustomerController {
  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const data = UpdatePreferencesSchema.parse(req.body);

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data,
      });

      res.status(200).json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input', details: e.errors });
      next(e);
    }
  }
}
