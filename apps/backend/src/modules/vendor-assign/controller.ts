import { Request, Response, NextFunction } from 'express';
import { VendorService } from './service';
import { UpdateJobStatusSchema } from '@triveni/shared-validation';
import { z } from 'zod';
import { BookingStatus } from '@triveni/shared-types';
import { PartnerContractService } from './partnerContract';

export class VendorController {
  static async getPartnerContract(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await PartnerContractService.getForVendor(req.user!.id)); } catch (e) { next(e); }
  }

  static async requestPartnerContractOtp(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await PartnerContractService.requestOtp(req.user!.id)); } catch (e) { next(e); }
  }

  static async signPartnerContract(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        version: z.string().max(40), hash: z.string().length(64), signerName: z.string().trim().min(2).max(150),
        signerRole: z.string().trim().min(2).max(100), signatureText: z.string().trim().min(2).max(150), otp: z.string().regex(/^\d{6}$/), acceptTerms: z.literal(true),
      });
      const data = schema.parse(req.body);
      const result = await PartnerContractService.sign(req.user!.id, {
        ...data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      });
      res.status(201).json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Enter valid signature details and the six-digit code.', details: e.errors });
      next(e);
    }
  }

  static async autoAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const result = await VendorService.autoAssign(bookingId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const dateStr = req.query.date as string | undefined;
      const jobs = await VendorService.getVendorJobs(vendorId, dateStr);
      res.status(200).json(jobs);
    } catch (e) {
      next(e);
    }
  }

  static async acceptJob(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const bookingId = req.params.id as string;
      const result = await VendorService.acceptJob(vendorId, bookingId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const bookingId = req.params.id as string;
      const data = UpdateJobStatusSchema.parse(req.body);
      
      const result = await VendorService.updateJobStatus(vendorId, bookingId, data.status as BookingStatus);
      res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid status', details: e.errors });
      next(e);
    }
  }

  static async pushTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const bookingId = req.params.id as string;
      const { latitude, longitude, speedKmh, headingDeg } = req.body;
      const result = await VendorService.recordTelemetry(vendorId, bookingId, {
        latitude: Number(latitude),
        longitude: Number(longitude),
        speedKmh: Number(speedKmh || 0),
        headingDeg: Number(headingDeg || 0),
      });
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const profile = await VendorService.getVendorProfile(vendorId);
      res.status(200).json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const vehicles = await VendorService.getVendorVehicles(vendorId);
      res.status(200).json(vehicles);
    } catch (e) {
      next(e);
    }
  }

  static async updatePushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ pushToken: z.string().max(500).nullable() });
      const { pushToken } = schema.parse(req.body);
      await VendorService.updatePushToken(req.user!.id, pushToken);
      res.status(204).send();
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid push token', details: e.errors });
      }
      next(e);
    }
  }

  static async saveOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const vendorId = req.user!.id;
      const data = z.record(z.any()).parse(req.body);
      const result = await VendorService.saveOnboarding(vendorId, data);
      res.status(200).json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid onboarding data.', details: e.errors });
      next(e);
    }
  }

  static async createDocumentUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        documentType: z.string().min(2).max(60),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(100),
        size: z.number().int().positive().max(10 * 1024 * 1024),
      });
      const result = await VendorService.createDocumentUploadUrl(req.user!.id, schema.parse(req.body));
      res.status(200).json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid document upload request.', details: e.errors });
      next(e);
    }
  }

  static async completeDocumentUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        documentType: z.string().min(2).max(60),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(100),
        objectKey: z.string().min(1).max(500),
      });
      const result = await VendorService.completeDocumentUpload(req.user!.id, schema.parse(req.body));
      res.status(201).json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid document completion request.', details: e.errors });
      next(e);
    }
  }

  static async getSupervisors(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await VendorService.getSupervisors(req.user!.id)); } catch (e) { next(e); }
  }

  static async addSupervisor(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().trim().min(2).max(150), phone: z.string().trim().min(10).max(16) });
      const { name, phone } = schema.parse(req.body);
      res.status(201).json(await VendorService.addSupervisor(req.user!.id, name, phone));
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Enter a supervisor name and valid mobile number.', details: e.errors });
      next(e);
    }
  }

  static async revokeSupervisor(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await VendorService.revokeSupervisor(req.user!.id, req.params.id as string));
    } catch (e) {
      next(e);
    }
  }

  static async assignSupervisor(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ supervisorId: z.string().uuid().nullable() });
      res.status(200).json(await VendorService.assignSupervisor(req.user!.id, req.params.id as string, schema.parse(req.body).supervisorId));
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Choose a valid supervisor.', details: e.errors });
      next(e);
    }
  }

  static async getSupervisorJobs(req: Request, res: Response, next: NextFunction) {
    try { res.status(200).json(await VendorService.getSupervisorJobs(req.user!.id)); } catch (e) { next(e); }
  }

  static async updateSupervisorStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateJobStatusSchema.parse(req.body);
      res.status(200).json(await VendorService.updateSupervisorJobStatus(req.user!.id, req.params.id as string, data.status as BookingStatus));
    } catch (e) {
      if (e instanceof z.ZodError) return next({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid booking status.', details: e.errors });
      next(e);
    }
  }
}

