import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentType } from '@triveni/shared-types';

export class PaymentService {
  /**
   * Initialize Razorpay client. Handles graceful fallback if keys are missing.
   */
  private static getRazorpayInstance() {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.startsWith('your_')) {
      return null; // Mock mode
    }
    return new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Creates an order in Razorpay for a specific booking and payment type.
   */
  static async createOrder(bookingId: string, type: PaymentType, customerId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };

    let amountToPay = 0;
    
    // In our spec, advance is 20% (stored implicitly as a calculation or explicitly).
    // The previous implementation used quote.quoteAmount * 0.2 for advance.
    // Since `advanceAmount` was removed from the schema, we calculate it dynamically.
    const finalAmount = Number(booking.finalAmount);
    if (type === 'advance') {
      if (booking.status !== 'REQUESTED' && booking.status !== 'QUOTED') {
        throw { statusCode: 400, message: 'Advance can only be paid for new bookings' };
      }
      amountToPay = finalAmount * 0.2; // 20%
    } else if (type === 'final') {
      if (booking.status !== 'IN_PROGRESS' && booking.status !== 'ARRIVED') {
         throw { statusCode: 400, message: 'Final payment is not due yet' };
      }
      // Assuming advance was exactly 20%, final is the remaining 80% plus any revisions
      const advancePaid = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { bookingId, type: 'advance', status: 'captured' }
      });
      amountToPay = finalAmount - Number(advancePaid._sum.amount || 0);
    }

    if (amountToPay <= 0) throw { statusCode: 400, message: 'No amount due' };

    const rzp = this.getRazorpayInstance();
    const receiptId = `rcpt_${bookingId}_${Date.now()}`;
    const amountInPaise = Math.round(amountToPay * 100);

    if (!rzp) {
      // Mock mode
      return {
        id: `mock_order_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        status: 'created',
      };
    }

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
    });

    return order;
  }

  /**
   * Verifies the Razorpay webhook signature and updates the DB.
   * Crucially, this must be idempotent.
   */
  static async verifyWebhook(body: any, signature: string) {
    const { RAZORPAY_WEBHOOK_SECRET } = getEnv();
    
    // In mock mode (no secret), we assume the webhook is just a manual local test
    if (RAZORPAY_WEBHOOK_SECRET && !RAZORPAY_WEBHOOK_SECRET.startsWith('your_')) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw { statusCode: 400, message: 'Invalid signature' };
      }
    }

    // Process event
    if (body.event === 'payment.captured') {
      const payment = body.payload.payment.entity;
      const orderId = payment.order_id;
      // In a real implementation, we'd need a mapping table from order_id -> bookingId,
      // or we pass bookingId in the payment notes during order creation.
      
      const bookingId = payment.notes?.bookingId;
      if (!bookingId) {
         console.error('Webhook missing bookingId in notes');
         return;
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { razorpayPaymentId: payment.id }
      });

      if (existingPayment) {
        console.log(`Payment ${payment.id} already processed`);
        return; // Idempotent
      }

      await prisma.payment.create({
        data: {
          bookingId,
          amount: payment.amount / 100, // convert paise to INR
          status: 'captured',
          razorpayOrderId: orderId,
          razorpayPaymentId: payment.id,
          idempotencyKey: payment.id,
          type: payment.notes?.type || 'advance',
        }
      });

      // Update booking status if this was an advance payment
      if (payment.notes?.type === 'advance') {
         const booking = await prisma.booking.findUnique({ where: { id: bookingId }});
         if (booking && (booking.status === 'REQUESTED' || booking.status === 'QUOTED')) {
           await prisma.booking.update({
             where: { id: bookingId },
             data: { status: 'CONFIRMED' }
           });
           
           await prisma.bookingStatusHistory.create({
            data: { 
              bookingId, 
              fromState: booking.status,
              toState: 'CONFIRMED',
              actorId: '00000000-0000-0000-0000-000000000000', // Webhook
              actorRole: 'admin',
            }
          });
          
          // Here we would also enqueue BullMQ jobs to dispatch notifications
         }
      }
    }
  }
}
