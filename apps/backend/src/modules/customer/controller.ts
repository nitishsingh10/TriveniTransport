import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { z } from 'zod';
import { isCustomerProfileComplete } from './profile';
import { AuthService } from '../auth/service';

const UpdatePreferencesSchema = z.object({
  whatsappOptIn: z.boolean().optional(),
  pushToken: z.string().nullable().optional(),
});

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number').optional(),
});

const PhoneChangeSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits').optional(),
});

const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(40),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().max(100).optional().default(''),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
  isDefault: z.boolean().optional(),
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
          savedAddresses: true,
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

  static async requestPhoneChangeOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = PhoneChangeSchema.parse(req.body);
      res.status(200).json(await AuthService.requestPhoneChangeOtp(phone));
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid mobile number.' });
      next(e);
    }
  }

  static async verifyPhoneChangeOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = PhoneChangeSchema.extend({ code: z.string().trim().regex(/^\d{6}$/) }).parse(req.body);
      const customer = await AuthService.verifyPhoneChangeOtp(req.user!.id, phone, code!);
      res.status(200).json({ ...customer, profileCompleted: isCustomerProfileComplete(customer.name, customer.phone) });
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid verification code.' });
      next(e);
    }
  }

  static async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: req.user!.id }, select: { savedAddresses: true } });
      res.status(200).json(Array.isArray(customer?.savedAddresses) ? customer.savedAddresses : []);
    } catch (e) { next(e); }
  }

  static async saveAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const address = AddressSchema.parse(req.body);
      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: req.user!.id }, select: { savedAddresses: true } });
        if (!customer) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Customer account not found' };
        const current = Array.isArray(customer.savedAddresses) ? customer.savedAddresses as any[] : [];
        const id = address.id || crypto.randomUUID();
        const updated = current.filter((item) => item?.id !== id).map((item) => ({ ...item, isDefault: address.isDefault ? false : Boolean(item.isDefault) }));
        updated.push({ ...address, id, isDefault: address.isDefault ?? updated.length === 0 });
        await tx.customer.update({ where: { id: req.user!.id }, data: { savedAddresses: updated as any } });
        return updated;
      });
      res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid address.' });
      next(e);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: req.user!.id }, select: { savedAddresses: true } });
        if (!customer) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Customer account not found' };
        const current = Array.isArray(customer.savedAddresses) ? customer.savedAddresses as any[] : [];
        const updated = current.filter((item) => item?.id !== req.params.addressId);
        if (updated.length < current.length && !updated.some((item) => item.isDefault) && updated.length) updated[0].isDefault = true;
        await tx.customer.update({ where: { id: req.user!.id }, data: { savedAddresses: updated as any } });
        return updated;
      });
      res.status(200).json(result);
    } catch (e) { next(e); }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.id;
      const data = UpdateProfileSchema.parse(req.body);

      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true, phone: true },
        });
        if (!current) {
          throw { statusCode: 404, code: 'NOT_FOUND', message: 'Customer account not found' };
        }

        if (data.phone && data.phone !== (current.phone || '').replace(/\D/g, '').slice(-10)) {
          throw { statusCode: 403, code: 'PHONE_VERIFICATION_REQUIRED', message: 'Verify the new mobile number with OTP before saving it.' };
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

