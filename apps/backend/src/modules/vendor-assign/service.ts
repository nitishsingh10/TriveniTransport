import { prisma } from '../../config/prisma';
import { getRedis } from '../../config/redis';
import { BookingStatus } from '@triveni/shared-types';

export class VendorService {
  /**
   * Assigns the single default vendor and the appropriate vehicle.
   * Phase 1 rule: Pick the smallest vehicle whose capacity >= booking.totalCft
   */
  static async autoAssign(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    
    if (booking.status !== 'CONFIRMED') {
      throw { statusCode: 400, message: 'Only CONFIRMED bookings can be assigned' };
    }

    const snapshot = booking.pricingSnapshot as any;
    const cftRequired = snapshot?.totalCft ? Number(snapshot.totalCft) : 0;

    // Get all active vehicles for our single vendor
    // Assuming there's one active vendor in the system from seed
    const vendor = await prisma.vendor.findFirst({ where: { status: 'active' } });
    if (!vendor) throw { statusCode: 500, message: 'No active vendors found' };

    const vehicles = await prisma.vehicle.findMany({
      where: { vendorId: vendor.id, active: true },
      orderBy: { capacityCft: 'asc' }, // Smallest first
    });

    if (vehicles.length === 0) {
      throw { statusCode: 500, message: 'No active vehicles found' };
    }

    // Find smallest capable vehicle
    let selectedVehicle = vehicles.find((v) => Number(v.capacityCft) >= cftRequired);

    // If none are large enough, pick the largest one (second trip will be required)
    if (!selectedVehicle) {
      selectedVehicle = vehicles[vehicles.length - 1];
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ASSIGNED',
        vendorId: vendor.id,
        vehicleId: selectedVehicle.id,
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromState: booking.status,
        toState: 'ASSIGNED',
        actorId: '00000000-0000-0000-0000-000000000000', // System
        actorRole: 'admin',
      }
    });

    // Notify vendor about new job assignment
    try {
      const { enqueueNotification } = await import('../../jobs/queue');
      await enqueueNotification('job_assigned', {
        userId: vendor.id,
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
    // Return both:
    // 1. Bookings assigned to this vendor
    // 2. Open CONFIRMED bookings awaiting driver partner acceptance (not yet assigned)
    const where: any = {
      OR: [
        { vendorId },
        { status: 'CONFIRMED', vendorId: null },
      ],
    };
    
    if (dateStr) {
      where.scheduledDate = new Date(dateStr);
    }

    return prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        customer: { select: { name: true, phone: true } },
        vendor: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { type: true, registrationNumber: true } },
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

      if (current.status === 'ASSIGNED' && current.vendorId === vendorId) {
        return { booking: current, newlyAssigned: false };
      }
      if (current.status !== 'CONFIRMED' || current.vendorId !== null) {
        throw { statusCode: 409, message: 'This move is no longer available to accept' };
      }

      const vendor = await tx.vendor.findUnique({
        where: { id: vendorId },
        include: { vehicles: { where: { active: true }, take: 1 } },
      });
      if (!vendor || vendor.status !== 'active') {
        throw { statusCode: 403, message: 'Driver partner account is not active' };
      }

      const vehicle = vendor.vehicles[0];
      if (!vehicle) {
        throw { statusCode: 409, message: 'Complete vehicle onboarding before accepting a move' };
      }

      // Conditional update makes acceptance single-winner when several drivers
      // tap Accept at the same time.
      const claim = await tx.booking.updateMany({
        where: { id: bookingId, status: 'CONFIRMED', vendorId: null },
        data: { status: 'ASSIGNED', vendorId: vendor.id, vehicleId: vehicle.id },
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
    if (status === 'ASSIGNED') {
      return this.acceptJob(vendorId, bookingId);
    }

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, vendorId } });
      if (!booking) throw { statusCode: 404, message: 'Assigned booking not found' };

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

  static async saveOnboarding(
    vendorId: string,
    data: {
      name?: string;
      vehicleNumber: string;
      vehicleType: string;
      capacityCft?: number;
      permitExpiry?: string;
      fitnessCertExpiry?: string;
    }
  ) {
    if (data.name) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { name: data.name },
      });
    }

    const regNum = (data.vehicleNumber || 'MH12CD5678').replace(/\s+/g, '').toUpperCase();
    const capacityCft = Number(data.capacityCft) || 500;
    const now = new Date();
    const defaultExpiry = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

    const permitDate = data.permitExpiry ? new Date(data.permitExpiry) : defaultExpiry;
    const fitnessDate = data.fitnessCertExpiry ? new Date(data.fitnessCertExpiry) : defaultExpiry;

    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: regNum },
      create: {
        vendorId,
        type: data.vehicleType || 'Commercial Goods Carrier',
        capacityCft,
        registrationNumber: regNum,
        permitExpiry: permitDate,
        fitnessCertExpiry: fitnessDate,
        active: true,
      },
      update: {
        vendorId,
        type: data.vehicleType || 'Commercial Goods Carrier',
        capacityCft,
        permitExpiry: permitDate,
        fitnessCertExpiry: fitnessDate,
        active: true,
      },
    });

    return {
      success: true,
      message: 'Driver and vehicle onboarding saved successfully',
      vehicle,
    };
  }
}

