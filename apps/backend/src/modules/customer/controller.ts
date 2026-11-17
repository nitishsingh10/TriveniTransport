import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { z } from 'zod';
import { isCustomerProfileComplete } from './profile';

const UpdatePreferencesSchema = z.object({
  whatsappOptIn: z.boolean().optional(),
  pushToken: z.string().nullable().optional(),
});

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number').optional(),
});

export class CustomerController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          whatsappOptIn: true,
          pushOptIn: true,
          createdAt: true,
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!customer) {
        return next({ statusCode: 404, code: 'NOT_FOUND', message: 'Customer account not found' });
      }

      // Completion is derived from the persisted profile fields so it cannot
      // drift from the name or phone number.
      const profileCompleted = isCustomerProfileComplete(customer.name, customer.phone);

      res.status(200).json({
        ...customer,
        profileCompleted,
        bookingsCount: customer._count.bookings,
      });
    } catch (e: any) {
      next(e);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const data = UpdateProfileSchema.parse(req.body);

      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });
        if (!current) {
          throw { statusCode: 404, code: 'NOT_FOUND', message: 'Customer account not found' };
        }

        if (data.phone) {
          const existing = await tx.customer.findFirst({
            where: {
              phone: data.phone,
              NOT: { id: customerId },
            },
            select: { id: true },
          });
          if (existing) {
            throw {
              statusCode: 409,
              code: 'PHONE_IN_USE',
              message: 'This mobile number is already linked to another account.',
            };
          }
        }

        return tx.customer.update({
          where: { id: customerId },
          data,
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        });
      });

      res.status(200).json({
        ...updated,
        profileCompleted: isCustomerProfileComplete(updated.name, updated.phone),
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid input', details: e.errors });
      }
      next(e);
    }
  }

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

