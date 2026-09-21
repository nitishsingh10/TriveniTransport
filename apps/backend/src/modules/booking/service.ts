import { prisma } from '../../config/prisma';
import { ItemizedQuoteInput } from '@triveni/shared-validation';
import { PricingService } from '../pricing/service';
import { acquireSlotLock, releaseSlotLock, isSlotLocked } from '../../config/redis';
import { BookingStatus } from '@triveni/shared-types';

export class BookingService {
  /**
   * Generates a new quote and creates a Draft booking.
   */
  static async createDraftBooking(customerId: string, input: ItemizedQuoteInput) {
    const quote = await PricingService.calculateItemizedQuote(input, customerId);

    const booking = await prisma.booking.create({
      data: {
        customerId,
        status: 'REQUESTED',
        pickupAddress: input.pickupAddress,
        dropAddress: input.dropAddress,
        pickupZoneId: '00000000-0000-0000-0000-000000000000', // Mock - requires geocoding
        dropZoneId: '00000000-0000-0000-0000-000000000000',   // Mock
        distanceKm: 15.5, // Mock
        configurationType: input.configurationType,
        floorNumber: input.floorNumber,
        liftAvailable: input.liftAvailable,
        scheduledDate: new Date(input.scheduledDate),
        scheduledSlot: input.scheduledSlot,
        baseQuoteAmount: quote.quoteAmount,
        finalAmount: quote.quoteAmount,
        pricingSnapshot: quote.snapshot as any,
      },
    });

    // Write initial history
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        toState: 'REQUESTED',
        actorId: customerId,
        actorRole: 'customer',
      },
    });

    return { booking, quote };
  }

  /**
   * Attempts to lock a slot for this booking for 10 minutes.
   */
  static async holdSlot(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };
    if (booking.status !== 'REQUESTED' && booking.status !== 'QUOTED') throw { statusCode: 400, message: 'Only requested/quoted bookings can be held' };

    // In a real dispatch logic, we find an available vehicle based on CFT
    // For now, assume a dummy vehicle ID for the lock
    const dummyVehicleId = 'vehicle-1'; 
    const dateStr = booking.scheduledDate.toISOString().split('T')[0];

    const locked = await acquireSlotLock(dummyVehicleId, dateStr, booking.id);
    if (!locked) {
      throw { statusCode: 409, code: 'SLOT_UNAVAILABLE', message: 'This slot is currently being booked by someone else. Please try again in a few minutes or select another date.' };
    }

    return { success: true, message: 'Slot held for 10 minutes. Please complete payment.' };
  }

  /**
   * Confirms a booking (called after successful payment)
   */
  static async confirmBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    
    // Validate transition
    if (booking.status !== 'REQUESTED' && booking.status !== 'QUOTED') {
      throw { statusCode: 400, message: 'Booking is already confirmed or cancelled' };
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    await prisma.bookingStatusHistory.create({
      data: { 
        bookingId, 
        fromState: booking.status,
        toState: 'CONFIRMED',
        actorId: '00000000-0000-0000-0000-000000000000', // System/Webhook
        actorRole: 'admin',
      }
    });

    const dummyVehicleId = 'vehicle-1'; 
    const dateStr = booking.scheduledDate.toISOString().split('T')[0];
    await releaseSlotLock(dummyVehicleId, dateStr);

    return updated;
  }

  /**
   * Cancels a booking
   */
  static async cancelBooking(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };

    const uncancelable: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];
    if (uncancelable.includes(booking.status as BookingStatus)) {
      throw { statusCode: 400, message: `Cannot cancel a booking in ${booking.status} state` };
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await prisma.bookingStatusHistory.create({
      data: { 
        bookingId, 
        fromState: booking.status,
        toState: 'CANCELLED',
        actorId: customerId,
        actorRole: 'customer',
      }
    });

    return updated;
  }

  static async listBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, name: true, phone: true } },
      }
    });
  }

  static async getBookingDetails(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId },
      include: {
        vendor: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, type: true, registrationNumber: true } },
        statusHistory: { orderBy: { timestamp: 'desc' } },
        payments: true,
      }
    });

    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    return booking;
  }
}
