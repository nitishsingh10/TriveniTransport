import { prisma } from '../../config/prisma';
import { CreateZoneInput, CreateZoneRateInput, CreateItemInput, CreatePricingRuleInput } from '@triveni/shared-validation';
import { BookingStatus } from '@triveni/shared-types';
import type { ServiceType } from '@triveni/shared-types';
import { VendorDocumentStore } from '../../services/vendorDocuments';
import { lockAndCheckVehicleSlot } from '../../services/dispatchAvailability';
import { PARTNER_CONTRACT_HASH, PARTNER_CONTRACT_VERSION } from '../vendor-assign/partnerContract';

function utcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class AdminService {
  static async getMetrics(serviceType?: ServiceType) {
    const serviceFilter = serviceType ? { serviceType } : {};
    const totalBookings = await prisma.booking.count({ where: serviceFilter });
    const activeBookings = await prisma.booking.count({
      where: { ...serviceFilter, status: { in: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'REVISION_PENDING'] } }
    });
    const completedBookings = await prisma.booking.count({ where: { ...serviceFilter, status: 'COMPLETED' } });
    const pendingBookings = await prisma.booking.count({ where: { ...serviceFilter, status: 'REQUESTED' } });

    const totalCustomers = await prisma.customer.count();
    const totalVendors = await prisma.vendor.count({ where: serviceType ? { serviceType } : undefined });
    const totalVehicles = await prisma.vehicle.count({ where: serviceType ? { vendor: { serviceType } } : undefined });

    const revenueAggr = await prisma.booking.aggregate({
      _sum: { finalAmount: true },
      where: { ...serviceFilter, status: 'COMPLETED' }
    });

    const activeAggr = await prisma.booking.aggregate({
      _sum: { finalAmount: true },
      where: { ...serviceFilter, status: { in: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } }
    });

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      pendingBookings,
      totalCustomers,
      totalVendors,
      totalVehicles,
      totalRevenue: Number(revenueAggr._sum.finalAmount || 0),
      activeRevenue: Number(activeAggr._sum.finalAmount || 0),
    };
  }

  static async listBookings(params: { status?: string; search?: string; skip?: number; take?: number; serviceType?: ServiceType }) {
    const { status, search, skip = 0, take = 50, serviceType } = params;
    const where: any = {};
    if (serviceType) where.serviceType = serviceType;
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupAddress: { contains: q, mode: 'insensitive' } },
        { dropAddress: { contains: q, mode: 'insensitive' } },
        { customer: { phone: { contains: q } } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          vendor: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, type: true, registrationNumber: true } },
          supervisor: { select: { id: true, name: true, phone: true } },
          payments: { select: { id: true, amount: true, status: true, type: true, createdAt: true } },
          _count: { select: { items: true, revisions: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, skip, take };
  }

  static async getBooking(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vendor: true,
        vehicle: true,
        items: true,
        revisions: true,
        payments: true,
        statusHistory: { orderBy: { timestamp: 'desc' } },
      },
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    return booking;
  }

  static async updateBookingStatus(adminId: string, bookingId: string, newStatus: BookingStatus, notes?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    const dispatchStates: BookingStatus[] = ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
    if (dispatchStates.includes(newStatus) && !booking.vendorId) {
      throw { statusCode: 409, code: 'PARTNER_ASSIGNMENT_REQUIRED', message: 'Assign an approved partner before moving the booking into dispatch.' };
    }
    if (dispatchStates.includes(newStatus) && booking.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: booking.vendorId } });
      if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || vendor.serviceType !== booking.serviceType) {
        throw { statusCode: 409, code: 'PARTNER_NOT_ELIGIBLE', message: 'The assigned partner must be active and fully verified before dispatch continues.' };
      }
      if (booking.serviceType === 'transport') {
        const dispatchDate = utcDayStart(booking.scheduledDate);
        const eligibleVehicle = booking.vehicleId ? await prisma.vehicle.findFirst({
          where: {
            id: booking.vehicleId,
            vendorId: vendor.id,
            active: true,
            verificationStatus: 'approved',
            permitExpiry: { gte: dispatchDate },
            fitnessCertExpiry: { gte: dispatchDate },
            insuranceExpiry: { gte: dispatchDate },
          },
        }) : null;
        if (!vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < dispatchDate || !eligibleVehicle) {
          throw { statusCode: 409, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'The driver licence and assigned vehicle must be valid on the scheduled move date.' };
        }
      }
    }
    if (newStatus === 'CONFIRMED' && booking.vendorId) {
      throw { statusCode: 409, code: 'REASSIGNMENT_REQUIRED', message: 'This booking already has a partner. Use the assignment control to change dispatch.' };
    }

    const fromState = booking.status;
    return prisma.$transaction(async (tx) => {
      const changed = await tx.booking.updateMany({
        where: { id: bookingId, status: fromState, vendorId: booking.vendorId },
        data: { status: newStatus },
      });
      if (changed.count !== 1) throw { statusCode: 409, code: 'BOOKING_CHANGED', message: 'Booking changed while you were editing it. Refresh and retry.' };
      await tx.bookingStatusHistory.create({
        data: { bookingId, fromState, toState: newStatus, actorId: adminId, actorRole: 'admin', notes: notes?.trim() || null },
      });
      return tx.booking.findUnique({ where: { id: bookingId } });
    });
  }

  static async assignBooking(adminId: string, bookingId: string, vendorId: string, vehicleId?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.status !== 'CONFIRMED' && booking.status !== 'ASSIGNED') {
      throw { statusCode: 409, message: 'Only a confirmed or not-yet-started assigned booking can be dispatched.' };
    }
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || vendor.serviceType !== booking.serviceType) {
      throw { statusCode: 400, code: 'VENDOR_NOT_ELIGIBLE', message: 'Choose an approved partner for the same service.' };
    }
    if (vendor.serviceType === 'packers_movers') {
      const signedContract = await prisma.vendorContractSignature.findUnique({ where: { vendorId_contractVersion: { vendorId, contractVersion: PARTNER_CONTRACT_VERSION } }, select: { id: true, contractHash: true } });
      if (!signedContract || signedContract.contractHash !== PARTNER_CONTRACT_HASH) throw { statusCode: 400, code: 'PARTNER_CONTRACT_REQUIRED', message: 'The P&M partner must sign the current agreement before assignment.' };
      const schedule = await prisma.vendorDocument.findFirst({ where: { vendorId, documentType: 'commercial_schedule' }, orderBy: { uploadedAt: 'desc' }, select: { status: true } });
      if (schedule?.status !== 'approved') throw { statusCode: 400, code: 'COMMERCIAL_SCHEDULE_REQUIRED', message: 'The signed P&M commercial schedule must be verified before assignment.' };
    }
    let eligibleVehicleId: string | null = null;
    if (booking.serviceType === 'transport') {
      if (!vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < utcDayStart(booking.scheduledDate)) {
        throw { statusCode: 400, code: 'DRIVER_LICENCE_EXPIRED', message: 'Choose a driver with a licence valid on the move date.' };
      }
      if (!vehicleId) throw { statusCode: 400, code: 'VEHICLE_REQUIRED', message: 'Select a verified truck for this pickup and truck order.' };
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, vendorId, active: true, verificationStatus: 'approved', permitExpiry: { gte: utcDayStart(booking.scheduledDate) }, fitnessCertExpiry: { gte: utcDayStart(booking.scheduledDate) }, insuranceExpiry: { gte: utcDayStart(booking.scheduledDate) } },
      });
      if (!vehicle) throw { statusCode: 400, code: 'VEHICLE_NOT_ELIGIBLE', message: 'Select an active, verified vehicle with licence, permit, fitness, and motor policy valid on the move date.' };
      const cftRequired = Number((booking.pricingSnapshot as any)?.totalCft || 0);
      if (Number(vehicle.capacityCft) < cftRequired) throw { statusCode: 400, code: 'NO_SUFFICIENT_CAPACITY', message: 'Selected truck cannot carry the quoted volume. Split or revise the order before dispatch.' };
      eligibleVehicleId = vehicle.id;
    }
    return prisma.$transaction(async (tx) => {
      if (eligibleVehicleId && !(await lockAndCheckVehicleSlot(tx, eligibleVehicleId, bookingId, booking.scheduledDate, booking.scheduledSlot))) {
        throw { statusCode: 409, code: 'VEHICLE_SLOT_UNAVAILABLE', message: 'This truck already has another move in the scheduled time slot.' };
      }
      const updatedCount = await tx.booking.updateMany({
        where: { id: bookingId, status: booking.status, vendorId: booking.vendorId },
        data: { vendorId, vehicleId: eligibleVehicleId, status: 'ASSIGNED', supervisorId: null },
      });
      if (updatedCount.count !== 1) throw { statusCode: 409, message: 'Booking assignment changed. Refresh and retry.' };
      await tx.bookingStatusHistory.create({ data: { bookingId, fromState: booking.status, toState: 'ASSIGNED', actorId: adminId, actorRole: 'admin' } });
      return tx.booking.findUnique({ where: { id: bookingId }, include: { vendor: true, vehicle: true } });
    });
  }

  static async listVendors(serviceType?: ServiceType) {
    return prisma.vendor.findMany({
      where: serviceType ? { serviceType } : undefined,
      include: {
        vehicles: true,
        documents: { select: { id: true, documentType: true, fileName: true, mimeType: true, status: true, reviewNotes: true, uploadedAt: true, reviewedAt: true }, orderBy: { uploadedAt: 'desc' } },
        contractSignatures: { where: { contractVersion: PARTNER_CONTRACT_VERSION }, select: { contractVersion: true, contractHash: true, signerName: true, signerRole: true, signedAt: true }, take: 1 },
        supervisors: { select: { id: true, name: true, phone: true, status: true, phoneVerifiedAt: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async reviewVendor(
    adminId: string,
    vendorId: string,
    nextStatus: 'under_review' | 'needs_changes' | 'approved' | 'rejected',
    notes?: string,
  ) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { vehicles: true } });
    if (!vendor) throw { statusCode: 404, message: 'Partner application not found.' };
    if (!vendor.serviceType) throw { statusCode: 409, message: 'Choose the partner service before reviewing this account.' };
    if (nextStatus === 'under_review' && !['submitted', 'needs_changes'].includes(vendor.onboardingStatus)) {
      throw { statusCode: 409, code: 'INVALID_REVIEW_TRANSITION', message: 'Only a submitted application can move into review.' };
    }
    if (['needs_changes', 'rejected'].includes(nextStatus) && !['submitted', 'under_review', 'needs_changes'].includes(vendor.onboardingStatus)) {
      throw { statusCode: 409, code: 'INVALID_REVIEW_TRANSITION', message: 'Only an application under review can be changed or rejected.' };
    }
    if (nextStatus === 'approved') {
      if (vendor.onboardingStatus !== 'submitted' && vendor.onboardingStatus !== 'under_review' && vendor.onboardingStatus !== 'needs_changes') {
        throw { statusCode: 409, message: 'Only a submitted application can be approved.' };
      }
      const data = vendor.onboardingData as Record<string, any>;
      if (vendor.serviceType === 'packers_movers') {
        const signature = await prisma.vendorContractSignature.findUnique({ where: { vendorId_contractVersion: { vendorId, contractVersion: PARTNER_CONTRACT_VERSION } }, select: { id: true, contractHash: true } });
        if (!signature || signature.contractHash !== PARTNER_CONTRACT_HASH) throw { statusCode: 409, code: 'PARTNER_CONTRACT_REQUIRED', message: 'The current P&M partner agreement must be signed before approval.' };
        const schedule = await prisma.vendorDocument.findFirst({ where: { vendorId, documentType: 'commercial_schedule' }, orderBy: { uploadedAt: 'desc' }, select: { status: true } });
        if (schedule?.status !== 'approved') throw { statusCode: 409, code: 'COMMERCIAL_SCHEDULE_REQUIRED', message: 'Verify a signed commercial schedule before activating this P&M partner.' };
        if (!data.businessName || !data.ownerName || !data.legalEntityType || !data.businessAddress || !Array.isArray(data.serviceAreas) || data.serviceAreas.length === 0 || !Number.isInteger(Number(data.teamSize)) || Number(data.teamSize) < 1) {
          throw { statusCode: 409, code: 'APPLICATION_INCOMPLETE', message: 'P&M application must include a legal business type, owner, address, service areas, and team size.' };
        }
      } else {
        const driver = data.driver || {};
        const vehicle = data.vehicle || {};
        const bank = data.bank || {};
        if (!driver.fullName || !driver.dlNumber || !vehicle.registrationNumber || !vehicle.type || !bank.accountHolderName || !bank.ifscCode) {
          throw { statusCode: 409, code: 'APPLICATION_INCOMPLETE', message: 'Driver application is missing required identity, vehicle, or payout details.' };
        }
        const validExpiry = (raw: unknown) => typeof raw === 'string' && !Number.isNaN(new Date(raw).getTime()) && new Date(raw) >= utcDayStart(new Date());
        if (!validExpiry(driver.dlExpiry) || !validExpiry(vehicle.permitExpiry) || !validExpiry(vehicle.fitnessCertExpiry) || !validExpiry(vehicle.insuranceExpiry)) {
          throw { statusCode: 409, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'Driving licence, permit, fitness, and motor policy must be current before approval.' };
        }
        if (!vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < utcDayStart(new Date())) {
          throw { statusCode: 409, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'Driving licence expiry must be saved to the partner record before approval.' };
        }
      }

      const documents = await prisma.vendorDocument.findMany({ where: { vendorId }, orderBy: { uploadedAt: 'desc' } });
      const latestStatus = new Map<string, string>();
      for (const document of documents) if (!latestStatus.has(document.documentType)) latestStatus.set(document.documentType, document.status);
      const required = vendor.serviceType === 'packers_movers'
        ? ['business_pan', 'owner_id', 'business_address_proof', 'bank_proof', 'commercial_schedule']
        : ['driver_license_front', 'identity_proof', 'vehicle_rc', 'vehicle_permit', 'vehicle_fitness', 'vehicle_insurance', 'vehicle_photo', 'bank_proof'];
      const unverified = required.filter((type) => latestStatus.get(type) !== 'approved');
      if (unverified.length) throw { statusCode: 409, code: 'DOCUMENTS_NOT_VERIFIED', message: `Approve each required document first: ${unverified.join(', ')}.` };
      if (vendor.serviceType === 'transport' && !vendor.vehicles.some((vehicle) =>
        vehicle.permitExpiry >= utcDayStart(new Date()) && vehicle.fitnessCertExpiry >= utcDayStart(new Date()) && Boolean(vehicle.insuranceExpiry && vehicle.insuranceExpiry >= utcDayStart(new Date()))
      )) {
        throw { statusCode: 409, code: 'VEHICLE_REQUIRED', message: 'Add a vehicle with current permit, fitness, and motor policy before approving a driver partner.' };
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          onboardingStatus: nextStatus,
          status: nextStatus === 'approved' ? 'active' : 'pending',
          reviewNotes: notes?.trim() || null,
          reviewedAt: new Date(),
          reviewedById: adminId,
          ...(nextStatus === 'approved' && vendor.serviceType === 'transport'
            ? { vehicles: { updateMany: { where: { vendorId, verificationStatus: 'pending', permitExpiry: { gte: utcDayStart(new Date()) }, fitnessCertExpiry: { gte: utcDayStart(new Date()) }, insuranceExpiry: { gte: utcDayStart(new Date()) } }, data: { verificationStatus: 'approved', active: true } } } }
            : {}),
          ...(nextStatus !== 'approved' && vendor.serviceType === 'transport'
            ? { vehicles: { updateMany: { where: { vendorId, active: true }, data: { active: false } } } }
            : {}),
        },
      });
      await tx.vendorReviewHistory.create({
        data: { vendorId, adminId, fromStatus: vendor.onboardingStatus, toStatus: nextStatus, notes: notes?.trim() || null },
      });
      return updated;
    });
  }

  static async listVendorDocuments(vendorId: string) {
    const documents = await prisma.vendorDocument.findMany({ where: { vendorId }, orderBy: [{ documentType: 'asc' }, { uploadedAt: 'desc' }] });
    return Promise.all(documents.map(async (document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      mimeType: document.mimeType,
      status: document.status,
      reviewNotes: document.reviewNotes,
      uploadedAt: document.uploadedAt,
      reviewedAt: document.reviewedAt,
      url: await VendorDocumentStore.createReadUrl(document.objectKey, document.mimeType, document.fileName),
    })));
  }

  static async getVendorContract(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true, serviceType: true } });
    if (!vendor) throw { statusCode: 404, message: 'Partner application not found.' };
    if (vendor.serviceType !== 'packers_movers') throw { statusCode: 404, message: 'This partner has no P&M agreement.' };
    const signature = await prisma.vendorContractSignature.findFirst({ where: { vendorId }, orderBy: { signedAt: 'desc' } });
    return { currentVersion: PARTNER_CONTRACT_VERSION, currentHash: PARTNER_CONTRACT_HASH, signature };
  }

  static async reviewVendorDocument(adminId: string, documentId: string, status: 'approved' | 'rejected', notes?: string) {
    const document = await prisma.vendorDocument.findUnique({ where: { id: documentId } });
    if (!document) throw { statusCode: 404, message: 'Verification document not found.' };
    return prisma.$transaction(async (tx) => {
      const reviewed = await tx.vendorDocument.update({
        where: { id: documentId },
        data: { status, reviewNotes: notes?.trim() || null, reviewedAt: new Date(), reviewedByAdminId: adminId },
        select: { id: true, vendorId: true, documentType: true, status: true, reviewNotes: true, reviewedAt: true },
      });
      if (status === 'rejected') {
        const vendor = await tx.vendor.findUnique({ where: { id: document.vendorId } });
        const requiredDocuments = vendor?.serviceType === 'packers_movers'
          ? ['business_pan', 'owner_id', 'business_address_proof', 'bank_proof', 'commercial_schedule']
          : ['driver_license_front', 'identity_proof', 'vehicle_rc', 'vehicle_permit', 'vehicle_fitness', 'vehicle_insurance', 'vehicle_photo', 'bank_proof'];
        const latestDocument = await tx.vendorDocument.findFirst({
          where: { vendorId: document.vendorId, documentType: document.documentType },
          orderBy: { uploadedAt: 'desc' },
          select: { id: true },
        });
        if (requiredDocuments.includes(document.documentType) && latestDocument?.id === document.id && vendor?.status === 'active' && vendor.onboardingStatus === 'approved') {
          await tx.vendor.update({ where: { id: vendor.id }, data: { status: 'pending', onboardingStatus: 'needs_changes', reviewNotes: notes?.trim() || 'A required verification document needs replacement.' } });
          if (vendor.serviceType === 'transport') {
            await tx.vehicle.updateMany({ where: { vendorId: vendor.id }, data: { active: false } });
          }
          await tx.vendorReviewHistory.create({
            data: { vendorId: vendor.id, adminId, fromStatus: 'approved', toStatus: 'needs_changes', notes: notes?.trim() || 'A required verification document needs replacement.' },
          });
        }
      }
      return reviewed;
    });
  }

  static async listVehicles(serviceType?: ServiceType) {
    return prisma.vehicle.findMany({
      where: serviceType ? { vendor: { serviceType } } : undefined,
      include: {
        vendor: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  static async listItems() {
    return prisma.item.findMany({
      where: { active: true },
      orderBy: { category: 'asc' },
    });
  }

  static async listPricingRules() {
    return prisma.pricingRule.findMany({
      orderBy: { ruleType: 'asc' },
    });
  }

  static async listZones() {
    return prisma.locationZone.findMany({
      include: {
        fromZoneRates: true,
        toZoneRates: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async listAuditLogs(skip = 0, take = 50) {
    return prisma.pricingAuditLog.findMany({
      include: { admin: { select: { name: true, phone: true } } },
      orderBy: { changedAt: 'desc' },
      skip,
      take,
    });
  }

  static async createZone(adminId: string, input: CreateZoneInput) {
    return prisma.locationZone.create({
      data: {
        name: input.name,
        zoneType: input.zoneType,
        pincodes: input.pincodes,
        createdBy: adminId,
      }
    });
  }

  static async createZoneRate(adminId: string, input: CreateZoneRateInput) {
    return prisma.$transaction(async (tx) => {
      // Create new active rate
      const rate = await tx.zoneRate.create({
        data: {
          fromZoneId: input.fromZoneId,
          toZoneId: input.toZoneId,
          distanceBand: input.distanceBand,
          rate: input.rate,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      // Audit log (append only)
      await tx.pricingAuditLog.create({
        data: {
          entityType: 'zone_rate',
          entityId: rate.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: String(input.rate),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return rate;
    });
  }

  static async createItem(adminId: string, input: CreateItemInput) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: input.name,
          category: input.category,
          defaultCft: input.defaultCft,
          defaultWeightKg: input.defaultWeightKg,
          baseHandlingRate: input.baseHandlingRate,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      await tx.pricingAuditLog.create({
        data: {
          entityType: 'item',
          entityId: item.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: JSON.stringify(input),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return item;
    });
  }

  static async createPricingRule(adminId: string, input: CreatePricingRuleInput) {
    return prisma.$transaction(async (tx) => {
      const rule = await tx.pricingRule.create({
        data: {
          ruleType: input.ruleType,
          configKey: input.configKey,
          value: input.value,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      await tx.pricingAuditLog.create({
        data: {
          entityType: 'pricing_rule',
          entityId: rule.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: String(input.value),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return rule;
    });
  }

  static async getNotifications(skip: number = 0, take: number = 50) {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  static async retryNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw { statusCode: 404, message: 'Notification not found' };
    if (notification.status !== 'failed') throw { statusCode: 400, message: 'Only failed notifications can be retried' };

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'queued' }
    });

    const { notificationsQueue } = require('../../jobs/queue');
    await notificationsQueue.add(notification.template, {
      type: notification.template,
      userId: notification.bookingId,
      userRole: notification.recipientRole,
      payload: notification.payload,
      bookingId: notification.bookingId,
    });

    return { message: 'Queued for retry' };
  }
}
