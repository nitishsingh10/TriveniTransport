import { prisma } from '../../config/prisma';
import { ItemizedQuoteInput } from '@triveni/shared-validation';
import { PricingService } from '../pricing/service';
import { GeocodingService } from '../geocoding/service';
import { ZoneService } from '../geocoding/zoneService';
import { VendorService } from '../vendor-assign/service';
import { acquireSlotLock, releaseSlotLock } from '../../config/redis';
import { BookingStatus } from '@triveni/shared-types';
import { EmailService } from '../../services/resend';

export class BookingService {
  private static async notifyAvailableDrivers(booking: {
    id: string;
    scheduledDate: Date;
    scheduledSlot: string;
  }) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      if (vendors.length === 0) return;

      const { enqueueNotification } = await import('../../jobs/queue');
      const payload = {
        bookingId: booking.id,
        date: booking.scheduledDate.toISOString().split('T')[0],
        scheduledSlot: booking.scheduledSlot,
      };
      const results = await Promise.allSettled(
        vendors.map((vendor) =>
          enqueueNotification('job_available', {
            userId: vendor.id,
            userRole: 'vendor',
            bookingId: booking.id,
            payload,
          })
        )
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) console.warn(`Could not queue ${failed} driver job notifications for ${booking.id}`);
    } catch (err) {
      // The driver's job feed also polls the confirmed-booking endpoint, so a
      // notification queue outage must not make an otherwise valid booking fail.
      console.warn('Could not dispatch new booking notifications to drivers:', err);
    }
  }

  /**
   * Generates a new quote and creates a booking.
   * Defaults to Cash on Delivery (COD) / Pay on Move Day so customers can book without online payment gates.
   */
  static async createDraftBooking(
    customerId: string,
    input: ItemizedQuoteInput & { paymentMethod?: 'cash_on_delivery' | 'online' }
  ) {
    // 1. Calculate real route distance and resolve zones from DB
    const route = await GeocodingService.calculateDistanceKm(input.pickupAddress, input.dropAddress);
    const distanceKm = route.distanceKm || 15.0;

    const pickupZone = await ZoneService.resolveZoneForAddress(input.pickupAddress);
    const dropZone = await ZoneService.resolveZoneForAddress(input.dropAddress);

    // 2. Generate itemized quote using resolved zones
    const quote = await PricingService.calculateItemizedQuote(input, customerId);

    // Creating a booking only prepares a draft. The customer confirms the move
    // explicitly from the payment step, regardless of payment method.
    const paymentMethod = input.paymentMethod || 'cash_on_delivery';
    const initialStatus: BookingStatus = 'REQUESTED';

    // Persist the booking and its required child records atomically so a failed
    // item/history insert cannot leave a partial draft.
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          customerId,
          status: initialStatus,
          pickupAddress: input.pickupAddress,
          dropAddress: input.dropAddress,
          alternateContactPhone: input.alternateContactPhone || null,
          pickupZoneId: pickupZone.id,
          dropZoneId: dropZone.id,
          distanceKm,
          configurationType: input.configurationType,
          floorNumber: input.floorNumber,
          liftAvailable: input.liftAvailable,
          scheduledDate: new Date(input.scheduledDate),
          scheduledSlot: input.scheduledSlot,
          baseQuoteAmount: quote.quoteAmount,
          finalAmount: quote.quoteAmount,
          pricingSnapshot: {
            ...(quote.snapshot as any),
            paymentMethod,
            distanceKm,
            durationMins: route.durationMins,
          },
        },
      });

      const snapshotItems = (quote.snapshot?.items as any[]) || [];
      if (input.items?.length) {
        await tx.bookingItem.createMany({
          data: input.items.map((item, idx) => {
            const snap = snapshotItems[idx] || {};
            return {
              bookingId: created.id,
              itemId: item.itemId || null,
              customName: item.customName || item.itemId || `Item ${idx + 1}`,
              quantity: item.quantity,
              packingTier: item.packingTier,
              unitPriceApplied: snap.baseRate || 0,
              lineTotal: snap.appliedRate || 0,
            };
          }),
        });
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: created.id,
          toState: initialStatus,
          actorId: customerId,
          actorRole: 'customer',
        },
      });

      return created;
    });

    return { booking, quote };
  }

  /**
   * Holds slot in Redis for 10 minutes
   */
  static async holdSlot(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };
    if (booking.status !== 'REQUESTED' && booking.status !== 'QUOTED') {
      throw { statusCode: 400, message: 'Only requested/quoted bookings can be held' };
    }

    const dateStr = booking.scheduledDate.toISOString().split('T')[0];
    const lockKey = booking.vehicleId || `slot:${dateStr}:${booking.scheduledSlot}`;

    const locked = await acquireSlotLock(lockKey, dateStr, booking.id);
    if (!locked) {
      throw {
        statusCode: 409,
        code: 'SLOT_UNAVAILABLE',
        message: 'This slot is currently being booked by someone else. Please try again in a few minutes or select another date.',
      };
    }

    return { success: true, message: 'Slot held for 10 minutes. Please complete payment.' };
  }

  /**
   * Confirms a booking using Cash on Delivery (Pay on Move Day).
   * Called directly by customer or from web app without Razorpay.
   */
  static async confirmBookingWithCod(bookingId: string, customerId: string) {
    return this.confirmBooking(bookingId, customerId, 'cash_on_delivery');
  }

  /**
   * Confirms a booking
   */
  static async confirmBooking(
    bookingId: string,
    customerId?: string,
    paymentMethod: 'cash_on_delivery' | 'online' = 'cash_on_delivery'
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    
    if (customerId && booking.customerId !== customerId) {
      throw { statusCode: 403, message: 'Forbidden' };
    }

    if (booking.status === 'CONFIRMED' || booking.status === 'ASSIGNED') {
      return booking; // Idempotent
    }

    if (booking.status !== 'REQUESTED' && booking.status !== 'QUOTED') {
      throw { statusCode: 400, message: `Booking in ${booking.status} state cannot be confirmed` };
    }

    const currentSnapshot = (booking.pricingSnapshot as any) || {};
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        pricingSnapshot: {
          ...currentSnapshot,
          paymentMethod,
        },
      },
    });

    await prisma.bookingStatusHistory.create({
      data: { 
        bookingId, 
        fromState: booking.status,
        toState: 'CONFIRMED',
        actorId: customerId || '00000000-0000-0000-0000-000000000000',
        actorRole: customerId ? 'customer' : 'admin',
      }
    });

    // Ensure payment record exists
    const existingPayment = await prisma.payment.findFirst({ where: { bookingId } });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          bookingId,
          amount: booking.finalAmount,
          status: paymentMethod === 'cash_on_delivery' ? 'created' : 'captured',
          type: 'final',
          razorpayOrderId: `${paymentMethod === 'cash_on_delivery' ? 'cod' : 'online'}_${bookingId}`,
          razorpayPaymentId: null,
          idempotencyKey: `${paymentMethod === 'cash_on_delivery' ? 'cod' : 'online'}_${bookingId}`,
        },
      });
    }

    // Booking is confirmed and ready for driver partner acceptance
    // Auto-assign is kept available via admin endpoint if manual override needed

    // Release Redis hold lock if present
    const dateStr = booking.scheduledDate.toISOString().split('T')[0];
    const lockKey = booking.vehicleId || `slot:${dateStr}:${booking.scheduledSlot}`;
    await releaseSlotLock(lockKey, dateStr).catch(() => {});

    // Send confirmation email
    if (booking.customer?.email) {
      EmailService.sendBookingConfirmationEmail(booking.customer.email, {
        bookingId,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        scheduledDate: booking.scheduledDate,
        amount: booking.finalAmount ? Number(booking.finalAmount) : null,
      }).catch((err) => console.error('Failed to dispatch booking confirmation email:', err));
    }

    // Enqueue BullMQ notification
    try {
      const { enqueueNotification } = await import('../../jobs/queue');
      await enqueueNotification('booking_confirmed', {
        userId: booking.customerId,
        userRole: 'customer',
        bookingId,
        payload: {
          bookingId,
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          scheduledDate: dateStr,
          amount: Number(booking.finalAmount),
          paymentMethod: paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online',
        },
      });
    } catch (qErr) {
      console.warn('Could not enqueue booking_confirmed notification:', qErr);
    }

    await this.notifyAvailableDrivers(booking);

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
        vehicle: { select: { id: true, type: true, registrationNumber: true } },
        items: true,
        payments: true,
      }
    });
  }

  static async getBookingDetails(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId },
      include: {
        vendor: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, type: true, registrationNumber: true } },
        items: true,
        statusHistory: { orderBy: { timestamp: 'desc' } },
        payments: true,
      }
    });

    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    return booking;
  }
}
