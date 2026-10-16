import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { z } from 'zod';
import { UserRole } from '@triveni/shared-types';

const RequestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format. Please provide a valid 10-15 digit number.'),
  role: z.enum(['customer', 'vendor', 'admin']),
});

const VerifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format.'),
  role: z.enum(['customer', 'vendor', 'admin']),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be exactly 6 numeric digits.'),
});

export class AuthController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RequestOtpSchema.parse(req.body);
      await AuthService.requestOtp(data.phone, data.role as UserRole);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid input data', details: e.errors });
      }
      next(e);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = VerifyOtpSchema.parse(req.body);
      const tokens = await AuthService.verifyOtp(data.phone, data.role as UserRole, data.code);
      res.status(200).json(tokens);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: e.errors[0]?.message || 'Invalid input data' });
      }
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : null;
      if (!refreshToken) throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Refresh token required' };
      
      const tokens = await AuthService.refreshToken(refreshToken);
      res.status(200).json(tokens);
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
