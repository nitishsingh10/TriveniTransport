import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { z } from 'zod';
import { UserRole } from '@triveni/shared-types';

const RequestOtpSchema = z
  .object({
    identifier: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    role: z.enum(['customer', 'vendor', 'admin']),
    isSignup: z.boolean().optional(),
  })
  .refine((data) => !!(data.identifier || data.phone || data.email), {
    message: 'Please provide either an email address or mobile phone number.',
  });

const VerifyOtpSchema = z
  .object({
    identifier: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    role: z.enum(['customer', 'vendor', 'admin']),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Verification code must be exactly 6 numeric digits.'),
    name: z.string().trim().min(2).max(150).optional(),
    isSignup: z.boolean().optional(),
  })
  .refine((data) => !!(data.identifier || data.phone || data.email), {
    message: 'Please provide either an email address or mobile phone number.',
  });

export class AuthController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RequestOtpSchema.parse(req.body);
      const result = await AuthService.requestOtp(
        { identifier: data.identifier, phone: data.phone, email: data.email },
        data.role as UserRole,
        data.isSignup
      );
      res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: e.errors[0]?.message || 'Invalid input data',
          details: e.errors,
        });
      }
      next(e);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = VerifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(
        { identifier: data.identifier, phone: data.phone, email: data.email },
        data.role as UserRole,
        data.code,
        data.name,
        data.isSignup
      );
      res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: e.errors[0]?.message || 'Invalid input data',
        });
      }
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : null;
      if (!refreshToken) throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Refresh token required' };
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : null;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (e) {
      next(e);
    }
  }
}
