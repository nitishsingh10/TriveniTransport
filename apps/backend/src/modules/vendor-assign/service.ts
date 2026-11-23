import { prisma } from '../../config/prisma';
import { getRedis } from '../../config/redis';
import { BookingStatus } from '@triveni/shared-types';
import type { ServiceType } from '@triveni/shared-types';
import { VendorDocumentStore } from '../../services/vendorDocuments';
import { PARTNER_CONTRACT_HASH, PARTNER_CONTRACT_VERSION } from './partnerContract';
import { lockAndCheckVehicleSlot, lockDispatchKey } from '../../services/dispatchAvailability';

function utcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class VendorService {
  /**
   * Assigns a verified transport partner and a vehicle that can carry the quoted volume.
   * The current dispatch flow has no supported multi-trip plan, so undersized vehicles are not assigned.
   */
  static async autoAssign(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    
    if (booking.status !== 'CONFIRMED') {
      throw { statusCode: 400, message: 'Only CONFIRMED bookings can be assigned' };
    }
    if (booking.serviceType !== 'transport') {
      throw { statusCode: 400, message: 'Automatic vehicle dispatch is only available for pickup and truck bookings.' };
    }

    const snapshot = booking.pricingSnapshot as any;
    const cftRequired = snapshot?.totalCft ? Number(snapshot.totalCft) : 0;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        active: true,
        verificationStatus: 'approved',
        permitExpiry: { gte: utcDayStart(booking.scheduledDate) },
        fitnessCertExpiry: { gte: utcDayStart(booking.scheduledDate) },
        insuranceExpiry: { gte: utcDayStart(booking.scheduledDate) },
        vendor: { status: 'active', onboardingStatus: 'approved', serviceType: 'transport', driverLicenseExpiry: { gte: utcDayStart(booking.scheduledDate) } },
      },
      orderBy: { capacityCft: 'asc' }, // Smallest first
      include: { vendor: true },
    });

    if (vehicles.length === 0) {
      throw { statusCode: 409, code: 'NO_ELIGIBLE_VEHICLE', message: 'No approved pickup and truck partner has a current eligible vehicle.' };
    }

    const capacityEligibleVehicles = vehicles.filter((vehicle) => Number(vehicle.capacityCft) >= cftRequired);
    if (capacityEligibleVehicles.length === 0) {
      throw { statusCode: 409, code: 'NO_SUFFICIENT_CAPACITY', message: 'No verified truck can carry the quoted volume. Split or revise the order before dispatch.' };
    }

    const { booking: updated, vehicle: selectedVehicle } = await prisma.$transaction(async (tx) => {
      let availableVehicle: typeof capacityEligibleVehicles[number] | undefined;
      for (const candidate of capacityEligibleVehicles) {
        if (await lockAndCheckVehicleSlot(tx, candidate.id, bookingId, booking.scheduledDate, booking.scheduledSlot)) {
          availableVehicle = candidate;
          break;
        }
      }
      if (!availableVehicle) {
        throw { statusCode: 409, code: 'NO_AVAILABLE_VEHICLE', message: 'All verified trucks are already assigned to another move in this time slot.' };
      }
      const claimed = await tx.booking.updateMany({
        where: { id: bookingId, status: 'CONFIRMED', vendorId: null, serviceType: 'transport' },
        data: { status: 'ASSIGNED', vendorId: availableVehicle.vendorId, vehicleId: availableVehicle.id },
      });
      if (claimed.count !== 1) throw { statusCode: 409, message: 'Booking was assigned by another operator. Refresh and retry.' };
      await tx.bookingStatusHistory.create({
        data: { bookingId, fromState: booking.status, toState: 'ASSIGNED', actorId: '00000000-0000-0000-0000-000000000000', actorRole: 'admin' },
      });
      return { booking: await tx.booking.findUnique({ where: { id: bookingId } }), vehicle: availableVehicle };
    });
    if (!updated) throw { statusCode: 404, message: 'Booking not found' };

    // Notify vendor about new job assignment
    try {
      const { enqueueNotification } = await import('../../jobs/queue');
      await enqueueNotification('job_assigned', {
        userId: selectedVehicle.vendorId,
        userRole: 'vendor',
        bookingId,
        payload: {
          bookingId,
          vehicleType: selectedVehicle.type,
          registrationNumber: selectedVehicle.registrationNumber,
          date: booking.scheduledDate.toISOString().split('T')[0],
          scheduledDate: booking.scheduledDate.toISOString().split('T')[0],
          scheduledSlot: booking.scheduledSlot,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
        },
      });
    } catch (err) {
      console.warn('Failed to enqueue vendor job_assigned notification:', err);
    }

    return updated;
  }

  static async getVendorJobs(vendorId: string, dateStr?: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || !vendor.serviceType) return [];
    await this.assertVendorApproved(vendorId, vendor.serviceType);
    const dateFilter = dateStr ? { scheduledDate: new Date(dateStr) } : {};
    if (vendor.serviceType === 'transport') {
      const eligibleVehicles = await prisma.vehicle.findMany({
        where: {
          vendorId,
          active: true,
          verificationStatus: 'approved',
        },
        select: { id: true, capacityCft: true, permitExpiry: true, fitnessCertExpiry: true, insuranceExpiry: true },
      });

      const [assigned, available] = await Promise.all([
        prisma.booking.findMany({
          where: { ...dateFilter, serviceType: 'transport', vendorId, status: { in: ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'] } },
          orderBy: { scheduledDate: 'asc' },
          include: {
            customer: { select: { name: true, phone: true } },
            vendor: { select: { id: true, name: true, phone: true } },
            vehicle: { select: { id: true, type: true, registrationNumber: true, active: true, verificationStatus: true, capacityCft: true, permitExpiry: true, fitnessCertExpiry: true, insuranceExpiry: true } },
            items: { select: { quantity: true } },
          },
        }),
        prisma.booking.findMany({
          where: { ...dateFilter, serviceType: 'transport', status: 'CONFIRMED', vendorId: null },
          orderBy: { scheduledDate: 'asc' },
          include: { vehicle: { select: { type: true, registrationNumber: true } }, items: { select: { quantity: true } } },
        }),
      ]);
      const eligibleOffers = available.filter((booking) =>
        Boolean(vendor.driverLicenseExpiry && vendor.driverLicenseExpiry >= utcDayStart(booking.scheduledDate))
        && eligibleVehicles.some((vehicle) =>
          Number(vehicle.capacityCft) >= Number((booking.pricingSnapshot as any)?.totalCft || 0)
          && vehicle.permitExpiry >= utcDayStart(booking.scheduledDate)
          && vehicle.fitnessCertExpiry >= utcDayStart(booking.scheduledDate)
          && Boolean(vehicle.insuranceExpiry && vehicle.insuranceExpiry >= utcDayStart(booking.scheduledDate))
        )
      );
      const eligibleAssigned = assigned.filter((booking) => {
        const vehicle = booking.vehicle;
        const moveDate = utcDayStart(booking.scheduledDate);
        const requiredCft = Number((booking.pricingSnapshot as any)?.totalCft || 0);
        return Boolean(vendor.driverLicenseExpiry && vendor.driverLicenseExpiry >= moveDate)
          && Boolean(vehicle?.active && vehicle.verificationStatus === 'approved'
            && vehicle.permitExpiry >= moveDate
            && vehicle.fitnessCertExpiry >= moveDate
            && vehicle.insuranceExpiry && vehicle.insuranceExpiry >= moveDate
            && Number(vehicle.capacityCft) >= requiredCft);
      });
      return [...eligibleAssigned, ...eligibleOffers.map((booking) => ({ ...booking, customer: null, vendor: null }))]
        .sort((left, right) => left.scheduledDate.getTime() - right.scheduledDate.getTime());
    }

    return prisma.booking.findMany({
      where: { ...dateFilter, serviceType: 'packers_movers', vendorId, status: { not: 'CANCELLED' } },
      orderBy: { scheduledDate: 'asc' },
      include: {
        customer: { select: { name: true, phone: true } },
        vendor: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { type: true, registrationNumber: true } },
        supervisor: { select: { id: true, name: true, phone: true, status: true, phoneVerifiedAt: true } },
        items: { select: { quantity: true } },
      },
    });
  }

  /**
   * Driver partner explicitly accepts a booking.
   * Associates the authenticated driver (vendorId) and their active vehicle to the booking,
   * transitions status from CONFIRMED to ASSIGNED, and alerts the customer with real driver info.
   */
  static async acceptJob(vendorId: string, bookingId: string) {
    const { booking, newlyAssigned } = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vendor: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, type: true, registrationNumber: true } },
        },
      });
      if (!current) throw { statusCode: 404, message: 'Booking not found' };
      if (current.serviceType !== 'transport') {
        throw { statusCode: 403, message: 'This service is dispatched by the P&M operations team.' };
      }
      const alreadyAssignedHere = current.status === 'ASSIGNED' && current.vendorId === vendorId;
      if (!alreadyAssignedHere && (current.status !== 'CONFIRMED' || current.vendorId !== null)) {
        throw { statusCode: 409, message: 'This move is no longer available to accept' };
      }

      const cftRequired = Number((current.pricingSnapshot as any)?.totalCft || 0);
      const vendor = await tx.vendor.findUnique({
        where: { id: vendorId },
        include: { vehicles: { where: {
          active: true,
          verificationStatus: 'approved',
          permitExpiry: { gte: utcDayStart(current.scheduledDate) },
          fitnessCertExpiry: { gte: utcDayStart(current.scheduledDate) },
          insuranceExpiry: { gte: utcDayStart(current.scheduledDate) },
        }, orderBy: { capacityCft: 'asc' } } },
      });
      if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || vendor.serviceType !== 'transport' || !vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < utcDayStart(current.scheduledDate)) {
        throw { statusCode: 403, message: 'Complete and pass driver partner verification before accepting orders.' };
      }

      if (alreadyAssignedHere) {
        const assignedVehicle = vendor.vehicles.find((candidate) => candidate.id === current.vehicleId);
        if (!assignedVehicle) throw { statusCode: 403, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'The vehicle assigned to this move is no longer verified for its scheduled date.' };
        return { booking: current, newlyAssigned: false };
      }

      const capacityEligibleVehicles = vendor.vehicles.filter((candidate) => Number(candidate.capacityCft) >= cftRequired);
      if (capacityEligibleVehicles.length === 0) {
        throw { statusCode: 409, code: 'NO_SUFFICIENT_CAPACITY', message: 'Your verified vehicle cannot carry the quoted volume. Contact operations before accepting this move.' };
      }

      let availableVehicle: typeof vendor.vehicles[number] | undefined;
      for (const candidate of capacityEligibleVehicles) {
        if (await lockAndCheckVehicleSlot(tx, candidate.id, bookingId, current.scheduledDate, current.scheduledSlot)) {
          availableVehicle = candidate;
          break;
        }
      }
      if (!availableVehicle) {
        throw { statusCode: 409, code: 'NO_AVAILABLE_VEHICLE', message: 'Your verified trucks are already assigned to another move in this time slot.' };
      }

      // Conditional update makes acceptance single-winner when several drivers
      // tap Accept at the same time.
      const claim = await tx.booking.updateMany({
        where: { id: bookingId, status: 'CONFIRMED', vendorId: null },
        data: { status: 'ASSIGNED', vendorId: vendor.id, vehicleId: availableVehicle.id },
      });
      if (claim.count !== 1) {
        throw { statusCode: 409, message: 'This move has already been accepted by another driver' };
      }

      const updated = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { name: true, phone: true } },
          vendor: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, type: true, registrationNumber: true } },
        },
      });
      if (!updated) throw { statusCode: 404, message: 'Booking not found' };

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromState: current.status,
          toState: 'ASSIGNED',
          actorId: vendorId,
          actorRole: 'vendor',
        },
      });
      return { booking: updated, newlyAssigned: true };
    });

    // Notify customer about driver acceptance
    if (newlyAssigned) {
      try {
        const { enqueueNotification } = await import('../../jobs/queue');
        await enqueueNotification('driver_assigned', {
          userId: booking.customerId,
          userRole: 'customer',
          bookingId,
          payload: {
            bookingId,
            scheduledDate: booking.scheduledDate.toISOString().split('T')[0],
            driverName: booking.vendor?.name,
            driverPhone: booking.vendor?.phone,
            vehicleType: booking.vehicle?.type,
            registrationNumber: booking.vehicle?.registrationNumber,
          },
        });
      } catch (e) {
        console.warn('Could not enqueue notification:', e);
      }
    }

    return booking;
  }

  static async updatePushToken(vendorId: string, pushToken: string | null) {
    return prisma.vendor.update({
      where: { id: vendorId },
      data: { pushToken },
      select: { id: true },
    });
  }

  static async updateJobStatus(vendorId: string, bookingId: string, status: BookingStatus) {
    await this.assertVendorApproved(vendorId, 'transport');
    if (status === 'ASSIGNED') {
      return this.acceptJob(vendorId, bookingId);
    }

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, vendorId } });
      if (!booking) throw { statusCode: 404, message: 'Assigned booking not found' };
      if (booking.serviceType !== 'transport') throw { statusCode: 403, message: 'This booking is not part of pickup and truck service.' };
      await this.assertTransportBookingCompliance(vendorId, booking);

      // Vendors can transition: ASSIGNED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED
      const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
        ASSIGNED: ['EN_ROUTE'],
        EN_ROUTE: ['ARRIVED'],
        ARRIVED: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED'],
        REQUESTED: [], QUOTED: [], CONFIRMED: [], REVISION_PENDING: [], CANCELLED: [], DISPUTED: [], COMPLETED: []
      };

      const allowed = allowedTransitions[booking.status as BookingStatus] || [];
      if (!allowed.includes(status)) {
        throw { statusCode: 400, message: `Invalid transition from ${booking.status} to ${status}` };
      }

      const changed = await tx.booking.updateMany({
        where: { id: bookingId, vendorId, status: booking.status },
        data: { status },
      });
      if (changed.count !== 1) {
        throw { statusCode: 409, message: 'Move status changed. Refresh the assignment and try again.' };
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromState: booking.status,
          toState: status,
          actorId: vendorId,
          actorRole: 'vendor',
        }
      });

      return tx.booking.findUnique({ where: { id: bookingId } });
    });
  }

  static async recordTelemetry(
    vendorId: string,
    bookingId: string,
    coords: { latitude: number; longitude: number; speedKmh: number; headingDeg: number }
  ) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, vendorId } });
    if (!booking) throw { statusCode: 404, message: 'Assigned booking not found' };
    if (booking.serviceType !== 'transport' || ['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw { statusCode: 403, message: 'Location updates are only available for an active pickup and truck assignment.' };
    }
    await this.assertTransportBookingCompliance(vendorId, booking);

    const redis = getRedis();
    const payload = {
      ...coords,
      timestamp: new Date().toISOString(),
    };
    await redis.set(`telemetry:${bookingId}`, JSON.stringify(payload), 'EX', 86400);
    return { success: true, telemetry: payload };
  }

  static async getVendorProfile(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        vehicles: { where: { active: true } },
        _count: { select: { bookings: true } },
        documents: {
          select: { id: true, documentType: true, fileName: true, mimeType: true, status: true, reviewNotes: true, uploadedAt: true, reviewedAt: true },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });
    if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
    return vendor;
  }

  static async getVendorVehicles(vendorId: string) {
    return prisma.vehicle.findMany({
      where: { vendorId, active: true },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  static async saveOnboarding(vendorId: string, data: Record<string, any>) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor?.serviceType) throw { statusCode: 403, message: 'Partner service is not configured.' };
    if (vendor.status === 'suspended') throw { statusCode: 403, message: 'Suspended partner accounts cannot edit onboarding.' };

    if (vendor.serviceType === 'packers_movers') {
      const signedContract = await prisma.vendorContractSignature.findUnique({
        where: { vendorId_contractVersion: { vendorId, contractVersion: PARTNER_CONTRACT_VERSION } },
        select: { id: true, contractHash: true },
      });
      if (!signedContract || signedContract.contractHash !== PARTNER_CONTRACT_HASH) throw { statusCode: 400, code: 'PARTNER_CONTRACT_REQUIRED', message: 'Review and sign the current P&M partner agreement before submitting your application.' };
    }

    const documents = await prisma.vendorDocument.findMany({ where: { vendorId }, orderBy: { uploadedAt: 'desc' }, select: { documentType: true, status: true } });
    const newestStatus = new Map<string, string>();
    for (const document of documents) if (!newestStatus.has(document.documentType)) newestStatus.set(document.documentType, document.status);
    const requiredDocuments = vendor.serviceType === 'packers_movers'
      ? ['business_pan', 'owner_id', 'business_address_proof', 'bank_proof']
      : ['driver_license_front', 'identity_proof', 'vehicle_rc', 'vehicle_permit', 'vehicle_fitness', 'vehicle_insurance', 'vehicle_photo', 'bank_proof'];
    const missingDocuments = requiredDocuments.filter((type) => !['pending', 'approved'].includes(newestStatus.get(type) || ''));
    if (missingDocuments.length) {
      throw { statusCode: 400, code: 'ONBOARDING_DOCUMENTS_REQUIRED', message: `Upload required verification documents: ${missingDocuments.join(', ')}.` };
    }

    const displayName = vendor.serviceType === 'packers_movers'
      ? String(data.businessName || '').trim()
      : String(data.driver?.fullName || '').trim();
    if (displayName.length < 2) throw { statusCode: 400, code: 'ONBOARDING_PROFILE_REQUIRED', message: 'Enter the required partner name.' };

    let safeOnboardingData: Record<string, any>;
    let serviceAreas: string[];
    if (vendor.serviceType === 'packers_movers') {
      const ownerName = String(data.ownerName || '').trim();
      const businessAddress = String(data.businessAddress || '').trim();
      const serviceAreaList = Array.isArray(data.serviceAreas) ? data.serviceAreas.map((area: unknown) => String(area).trim()).filter(Boolean) : [];
      const teamSize = Number(data.teamSize);
      const legalEntityType = String(data.legalEntityType || '').trim();
      if (ownerName.length < 2 || businessAddress.length < 8 || serviceAreaList.length === 0 || !Number.isInteger(teamSize) || teamSize < 1 || teamSize > 5000 || !legalEntityType) {
        throw { statusCode: 400, code: 'ONBOARDING_PROFILE_INCOMPLETE', message: 'Enter the owner, business type, full address, at least one service area, and a valid crew size.' };
      }
      serviceAreas = serviceAreaList.map((area: string) => area.slice(0, 120)).slice(0, 100);
      safeOnboardingData = {
        businessName: displayName.slice(0, 150),
        ownerName: ownerName.slice(0, 150),
        legalEntityType: legalEntityType.slice(0, 40),
        businessAddress: businessAddress.slice(0, 1000),
        serviceAreas,
        teamSize,
      };
    } else {
      const driver = data.driver || {};
      const vehicleData = data.vehicle || {};
      const bank = data.bank || {};
      const verifiedPhone = String(vendor.phone || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
      const submittedPhone = String(driver.phone || '').replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
      if (!/^[6-9]\d{9}$/.test(verifiedPhone) || submittedPhone !== verifiedPhone) {
        throw { statusCode: 400, code: 'VERIFIED_PHONE_REQUIRED', message: 'Use the same mobile number you verified for this driver partner account.' };
      }
      if (String(driver.dlNumber || '').trim().length < 5 || !String(driver.city || '').trim()) {
        throw { statusCode: 400, code: 'DRIVER_DETAILS_REQUIRED', message: 'Enter your driving licence number and operating city.' };
      }
      const regNum = String(vehicleData.registrationNumber || data.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
      const capacityCft = Number(vehicleData.capacityCft || data.capacityCft || 0);
      if (!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(regNum) || !(vehicleData.type || data.vehicleType) || !Number.isInteger(capacityCft) || capacityCft < 1) {
        throw { statusCode: 400, code: 'VEHICLE_DETAILS_REQUIRED', message: 'Enter the truck registration number and vehicle type.' };
      }
      const futureDate = (raw: unknown) => typeof raw === 'string' && !Number.isNaN(new Date(raw).getTime()) && new Date(raw) >= utcDayStart(new Date());
      if (!futureDate(driver.dlExpiry) || !futureDate(vehicleData.insuranceExpiry)) {
        throw { statusCode: 400, code: 'INVALID_DOCUMENT_EXPIRY', message: 'Enter current, unexpired driving licence and motor policy dates.' };
      }
      const accountNumber = String(bank.accountNumber || '').replace(/\s/g, '');
      const ifscCode = String(bank.ifscCode || '').trim().toUpperCase();
      if (String(bank.accountHolderName || '').trim().length < 2 || !/^\d{9,18}$/.test(accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        throw { statusCode: 400, code: 'PAYOUT_DETAILS_REQUIRED', message: 'Enter a valid account holder, account number, and IFSC code.' };
      }
      if (data.agreementAccepted !== true) throw { statusCode: 400, code: 'AGREEMENT_REQUIRED', message: 'Accept the partner compliance declaration before submitting.' };
      const expiry = (value: unknown) => {
        const date = typeof value === 'string' ? new Date(value) : new Date('invalid');
        if (Number.isNaN(date.getTime()) || date < utcDayStart(new Date())) {
          throw { statusCode: 400, code: 'INVALID_DOCUMENT_EXPIRY', message: 'Enter valid, unexpired permit and fitness dates.' };
        }
        return date;
      };
      const permitExpiry = expiry(vehicleData.permitExpiry || data.permitExpiry);
      const fitnessCertExpiry = expiry(vehicleData.fitnessCertExpiry || data.fitnessCertExpiry);
      serviceAreas = [String(driver.city).trim().slice(0, 120)];
      safeOnboardingData = {
        driver: {
          fullName: displayName.slice(0, 150),
          phone: verifiedPhone,
          email: String(driver.email || '').slice(0, 254),
          city: serviceAreas[0],
          experienceYears: String(driver.experienceYears || '').slice(0, 3),
          emergencyContact: String(driver.emergencyContact || '').slice(0, 150),
          emergencyPhone: String(driver.emergencyPhone || '').replace(/\D/g, '').slice(-10),
          dlNumber: String(driver.dlNumber).trim().toUpperCase().slice(0, 40),
          dlExpiry: new Date(String(driver.dlExpiry)).toISOString(),
          dlCategory: String(driver.dlCategory || '').slice(0, 100),
        },
        vehicle: {
          registrationNumber: regNum,
          type: String(vehicleData.type || data.vehicleType).slice(0, 100),
          capacityCft,
          makeModel: String(vehicleData.makeModel || '').slice(0, 150),
          payloadTons: String(vehicleData.payloadTons || '').slice(0, 40),
          rcNumber: String(vehicleData.rcNumber || '').slice(0, 60),
          permitExpiry: permitExpiry.toISOString(),
          fitnessCertExpiry: fitnessCertExpiry.toISOString(),
          insurancePolicyNumber: String(vehicleData.insurancePolicyNumber || '').slice(0, 100),
          insuranceExpiry: new Date(String(vehicleData.insuranceExpiry)).toISOString(),
        },
        bank: {
          accountHolderName: String(bank.accountHolderName).trim().slice(0, 150),
          bankName: String(bank.bankName || '').slice(0, 150),
          accountLast4: accountNumber.slice(-4),
          ifscCode,
          upiId: String(bank.upiId || '').slice(0, 100),
        },
        agreementAccepted: true,
      };
    }

    const vehicle = await prisma.$transaction(async (tx) => {
      let savedVehicle: any = null;
      if (vendor.serviceType === 'transport') {
        const vehicleData = data.vehicle || {};
        const registrationNumber = String(vehicleData.registrationNumber || data.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
        const existingVehicle = await tx.vehicle.findUnique({ where: { registrationNumber } });
        if (existingVehicle && existingVehicle.vendorId !== vendorId) {
          throw { statusCode: 409, code: 'VEHICLE_ALREADY_REGISTERED', message: 'This vehicle is linked to another partner account.' };
        }
        const vehicleToSave = {
          vendorId,
          type: String(vehicleData.type || data.vehicleType),
          capacityCft: Number(vehicleData.capacityCft || data.capacityCft || 0),
          registrationNumber,
          permitExpiry: new Date(String((safeOnboardingData as any).vehicle.permitExpiry)),
          fitnessCertExpiry: new Date(String((safeOnboardingData as any).vehicle.fitnessCertExpiry)),
          insuranceExpiry: new Date(String(vehicleData.insuranceExpiry)),
          active: false,
          verificationStatus: 'pending' as const,
        };
        savedVehicle = existingVehicle
          ? await tx.vehicle.update({ where: { id: existingVehicle.id }, data: vehicleToSave })
          : await tx.vehicle.create({ data: vehicleToSave });
      }
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          name: displayName,
          driverLicenseExpiry: vendor.serviceType === 'transport' ? new Date(String((safeOnboardingData as any).driver.dlExpiry)) : null,
          onboardingData: safeOnboardingData,
          serviceAreas,
          status: 'pending',
          onboardingStatus: 'submitted',
          reviewedAt: null,
          reviewedById: null,
          reviewNotes: null,
        },
      });
      return savedVehicle;
    });
    return { success: true, onboardingStatus: 'submitted', vehicle };
  }

  static async assertVendorApproved(vendorId: string, serviceType?: ServiceType) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { status: true, onboardingStatus: true, serviceType: true, driverLicenseExpiry: true } });
    if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || (serviceType && vendor.serviceType !== serviceType)) {
      throw { statusCode: 403, code: 'PARTNER_NOT_APPROVED', message: 'Partner verification is required before accessing orders.' };
    }
    if (serviceType === 'transport') {
      const now = new Date();
      if (!vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < utcDayStart(now)) {
        throw { statusCode: 403, code: 'DRIVER_LICENCE_EXPIRED', message: 'Renew and re-verify your driving licence before accessing pickup and truck orders.' };
      }
      const eligibleVehicle = await prisma.vehicle.count({
        where: {
          vendorId,
          active: true,
          verificationStatus: 'approved',
          permitExpiry: { gte: utcDayStart(now) },
          fitnessCertExpiry: { gte: utcDayStart(now) },
          insuranceExpiry: { gte: utcDayStart(now) },
        },
      });
      if (!eligibleVehicle) throw { statusCode: 403, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'Renew and re-verify a vehicle document before accessing pickup and truck orders.' };
    }
    return vendor;
  }

  private static async assertTransportBookingCompliance(vendorId: string, booking: { scheduledDate: Date; vehicleId: string | null; pricingSnapshot: unknown }) {
    const moveDate = utcDayStart(booking.scheduledDate);
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { status: true, onboardingStatus: true, serviceType: true, driverLicenseExpiry: true } });
    const vehicle = booking.vehicleId ? await prisma.vehicle.findFirst({
      where: { id: booking.vehicleId, vendorId, active: true, verificationStatus: 'approved' },
      select: { capacityCft: true, permitExpiry: true, fitnessCertExpiry: true, insuranceExpiry: true },
    }) : null;
    const requiredCft = Number((booking.pricingSnapshot as any)?.totalCft || 0);
    if (!vendor || vendor.status !== 'active' || vendor.onboardingStatus !== 'approved' || vendor.serviceType !== 'transport'
      || !vendor.driverLicenseExpiry || vendor.driverLicenseExpiry < moveDate
      || !vehicle || vehicle.permitExpiry < moveDate || vehicle.fitnessCertExpiry < moveDate
      || !vehicle.insuranceExpiry || vehicle.insuranceExpiry < moveDate || Number(vehicle.capacityCft) < requiredCft) {
      throw { statusCode: 403, code: 'VEHICLE_COMPLIANCE_EXPIRED', message: 'The driver and the truck assigned to this move must be fully verified and compliant on its scheduled date.' };
    }
  }

  static async createDocumentUploadUrl(vendorId: string, data: { documentType: string; fileName: string; mimeType: string; size: number }) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { serviceType: true, status: true } });
    if (!vendor?.serviceType || vendor.status === 'suspended') throw { statusCode: 403, message: 'Partner account cannot upload onboarding documents.' };
    const allowed = vendor.serviceType === 'packers_movers'
      ? ['business_pan', 'owner_id', 'business_address_proof', 'bank_proof', 'gst_certificate', 'commercial_schedule']
      : ['driver_license_front', 'driver_license_back', 'identity_proof', 'vehicle_rc', 'vehicle_permit', 'vehicle_fitness', 'vehicle_insurance', 'vehicle_photo', 'bank_proof'];
    if (!allowed.includes(data.documentType)) throw { statusCode: 400, code: 'DOCUMENT_TYPE_NOT_ALLOWED', message: 'This document does not apply to the selected partner service.' };
    return VendorDocumentStore.createUploadUrl(vendorId, data.documentType, data.fileName, data.mimeType, data.size);
  }

  static async completeDocumentUpload(vendorId: string, data: { documentType: string; fileName: string; mimeType: string; objectKey: string }) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { serviceType: true, status: true } });
    if (!vendor?.serviceType || vendor.status === 'suspended') throw { statusCode: 403, message: 'Partner account cannot upload onboarding documents.' };
    const allowed = vendor.serviceType === 'packers_movers'
      ? ['business_pan', 'owner_id', 'business_address_proof', 'bank_proof', 'gst_certificate', 'commercial_schedule']
      : ['driver_license_front', 'driver_license_back', 'identity_proof', 'vehicle_rc', 'vehicle_permit', 'vehicle_fitness', 'vehicle_insurance', 'vehicle_photo', 'bank_proof'];
    if (!allowed.includes(data.documentType)) throw { statusCode: 400, code: 'DOCUMENT_TYPE_NOT_ALLOWED', message: 'This document does not apply to the selected partner service.' };
    await VendorDocumentStore.verifyUploadedObject(vendorId, data.documentType, data.objectKey, data.mimeType);
    return prisma.vendorDocument.create({
      data: { vendorId, documentType: data.documentType, fileName: data.fileName.slice(0, 255), mimeType: data.mimeType, objectKey: data.objectKey },
      select: { id: true, documentType: true, fileName: true, mimeType: true, status: true, uploadedAt: true },
    });
  }

  static async getSupervisors(vendorId: string) {
    await this.assertVendorApproved(vendorId, 'packers_movers');
    return prisma.supervisor.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' } });
  }

  static async addSupervisor(vendorId: string, name: string, phone: string) {
    await this.assertVendorApproved(vendorId, 'packers_movers');
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) throw { statusCode: 400, code: 'INVALID_PHONE', message: 'Enter a valid 10-digit Indian mobile number.' };
    const existing = await prisma.supervisor.findUnique({ where: { phone: normalizedPhone } });
    if (existing) {
      if (existing.vendorId !== vendorId || existing.status !== 'suspended') {
        throw { statusCode: 409, code: 'PHONE_ALREADY_INVITED', message: 'This number already belongs to a supervisor account.' };
      }
      return prisma.$transaction(async (tx) => {
        await tx.session.updateMany({ where: { supervisorId: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
        return tx.supervisor.update({
          where: { id: existing.id },
          data: { name: name.trim(), status: 'invited', phoneVerifiedAt: null },
        });
      });
    }
    try {
      return await prisma.supervisor.create({ data: { vendorId, name: name.trim(), phone: normalizedPhone } });
    } catch (error: any) {
      if (error?.code === 'P2002') throw { statusCode: 409, code: 'PHONE_ALREADY_INVITED', message: 'This number already belongs to a supervisor account.' };
      throw error;
    }
  }

  static async revokeSupervisor(vendorId: string, supervisorId: string) {
    await this.assertVendorApproved(vendorId, 'packers_movers');
    return prisma.$transaction(async (tx) => {
      const supervisor = await tx.supervisor.findFirst({ where: { id: supervisorId, vendorId } });
      if (!supervisor) throw { statusCode: 404, code: 'SUPERVISOR_NOT_FOUND', message: 'This supervisor does not belong to your business.' };
      if (supervisor.status === 'suspended') return supervisor;

      await lockDispatchKey(tx, `supervisor:${supervisorId}`);
      const assignedBookings = await tx.booking.findMany({
        where: { supervisorId, vendorId },
        select: { id: true },
      });
      await tx.booking.updateMany({
        where: { supervisorId, vendorId },
        data: { supervisorId: null },
      });
      if (assignedBookings.length) {
        await tx.bookingSupervisorHistory.createMany({
          data: assignedBookings.map(({ id: bookingId }) => ({ bookingId, supervisorId: null, assignedByVendorId: vendorId })),
        });
      }
      await tx.session.updateMany({ where: { supervisorId, revokedAt: null }, data: { revokedAt: new Date() } });
      return tx.supervisor.update({ where: { id: supervisorId }, data: { status: 'suspended' } });
    });
  }

  static async assignSupervisor(vendorId: string, bookingId: string, supervisorId: string | null) {
    await this.assertVendorApproved(vendorId, 'packers_movers');
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, vendorId, serviceType: 'packers_movers' } });
      if (!booking) throw { statusCode: 404, message: 'P&M booking assigned to this vendor was not found.' };
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') throw { statusCode: 409, message: 'A closed booking cannot change supervisor assignment.' };
      if (supervisorId) {
        await lockDispatchKey(tx, `supervisor:${supervisorId}`);
        const supervisor = await tx.supervisor.findFirst({ where: { id: supervisorId, vendorId, status: 'active', phoneVerifiedAt: { not: null } } });
        if (!supervisor) throw { statusCode: 400, code: 'SUPERVISOR_NOT_VERIFIED', message: 'Select an OTP-verified supervisor from your business.' };
      }
      await tx.booking.update({ where: { id: booking.id }, data: { supervisorId } });
      await tx.bookingSupervisorHistory.create({ data: { bookingId, supervisorId, assignedByVendorId: vendorId } });
      return tx.booking.findUnique({ where: { id: bookingId }, include: { supervisor: { select: { id: true, name: true, phone: true } } } });
    });
  }

  static async getSupervisorJobs(supervisorId: string) {
    const supervisor = await prisma.supervisor.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.status !== 'active' || !supervisor.phoneVerifiedAt) throw { statusCode: 403, code: 'SUPERVISOR_NOT_VERIFIED', message: 'Supervisor OTP verification is required.' };
    await this.assertVendorApproved(supervisor.vendorId, 'packers_movers');
    return prisma.booking.findMany({
      where: { supervisorId, vendorId: supervisor.vendorId, serviceType: 'packers_movers', status: { not: 'CANCELLED' } },
      orderBy: { scheduledDate: 'asc' },
      include: { customer: { select: { name: true, phone: true } }, vehicle: { select: { type: true, registrationNumber: true } }, items: { select: { quantity: true } } },
    });
  }

  static async updateSupervisorJobStatus(supervisorId: string, bookingId: string, status: BookingStatus) {
    const supervisor = await prisma.supervisor.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.status !== 'active' || !supervisor.phoneVerifiedAt) throw { statusCode: 403, code: 'SUPERVISOR_NOT_VERIFIED', message: 'Supervisor OTP verification is required.' };
    await this.assertVendorApproved(supervisor.vendorId, 'packers_movers');
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, supervisorId, vendorId: supervisor.vendorId, serviceType: 'packers_movers' } });
    if (!booking) throw { statusCode: 404, message: 'Assigned P&M booking not found.' };
    const transitions: Record<string, BookingStatus[]> = { ASSIGNED: ['EN_ROUTE'], EN_ROUTE: ['ARRIVED'], ARRIVED: ['IN_PROGRESS'], IN_PROGRESS: ['COMPLETED'] };
    if (!(transitions[booking.status] || []).includes(status)) throw { statusCode: 400, message: `Invalid transition from ${booking.status} to ${status}.` };
    return prisma.$transaction(async (tx) => {
      const changed = await tx.booking.updateMany({ where: { id: bookingId, supervisorId, status: booking.status }, data: { status } });
      if (changed.count !== 1) throw { statusCode: 409, message: 'Booking changed. Refresh and try again.' };
      await tx.bookingStatusHistory.create({ data: { bookingId, fromState: booking.status, toState: status, actorId: supervisorId, actorRole: 'supervisor' } });
      return tx.booking.findUnique({ where: { id: bookingId } });
    });
  }

}

