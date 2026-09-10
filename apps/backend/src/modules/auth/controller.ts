import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { z } from 'zod';
import { UserRole } from '@triveni/shared-types';

const RequestOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  role: z.enum(['customer', 'vendor', 'admin']),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  role: z.enum(['customer', 'vendor', 'admin']),
  code: z.string().length(6),
});

export class AuthController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RequestOtpSchema.parse(req.body);
      await AuthService.requestOtp(data.phone, data.role as UserRole);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input data', details: e.errors });
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
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid input data' });
      }
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Refresh token required' };
      
      const tokens = await AuthService.refreshToken(refreshToken);
      res.status(200).json(tokens);
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (e) {
      next(e);
    }
  }
}
