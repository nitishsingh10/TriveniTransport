import { prisma } from '../../config/prisma';
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
      // Here you could flag a "requires_two_trips" warning on the booking
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

    return updated;
  }

  static async getVendorJobs(vendorId: string, dateStr?: string) {
    const where: any = { vendorId };
    
    if (dateStr) {
      where.scheduledDate = new Date(dateStr);
    }

    return prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { type: true, registrationNumber: true } },
      }
    });
  }

  static async updateJobStatus(vendorId: string, bookingId: string, status: BookingStatus) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, vendorId } });
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

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromState: booking.status,
        toState: status,
        actorId: vendorId,
        actorRole: 'vendor',
      }
    });

    return updated;
  }
}
