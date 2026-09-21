import { Worker } from 'bullmq';
import { redisConnection } from '../queue';
import { PushNotificationService } from '../../services/expo';
import { prisma } from '../../config/prisma';
import { sendSmsOtp } from '../../services/msg91'; // We can reuse MSG91 SMS for notifications

export const notificationWorker = new Worker('notifications', async job => {
  const { type, userId, userRole, payload } = job.data;
  console.log(`[Job] Processing notification ${type} for ${userRole} ${userId}`);

  // Fetch user preferences
  let user: any;
  if (userRole === 'customer') {
    user = await prisma.customer.findUnique({ where: { id: userId } });
  } else if (userRole === 'vendor') {
    user = await prisma.vendor.findUnique({ where: { id: userId } });
  }

  if (!user) throw new Error(`User ${userId} not found`);

  const pushToken = user.pushToken;
  const phone = user.phone;
  const whatsappOptIn = userRole === 'customer' ? user.whatsappOptIn : true; // Assuming vendors always opt in

  // Logic: Send push if token exists. Send WhatsApp/SMS based on template logic.
  try {
    if (pushToken) {
      const title = getPushTitle(type, payload);
      const body = getPushBody(type, payload);
      await PushNotificationService.sendPush(pushToken, title, body, payload);
      console.log(`[Job] Push sent to ${pushToken}`);
    }

    if (phone) {
      // If whatsapp is opted in, we'd call MSG91 Whatsapp API.
      // For this spec, we reuse sendSmsOtp as a mock for MSG91 SMS delivery.
      const smsText = getSmsBody(type, payload);
      
      // We pass the smsText as the 'otp' param just to use the existing mock function in msg91.ts
      // In production, you'd have a dedicated sendSms() function.
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MOCK MSG91 SMS] To: ${phone} | Text: ${smsText}`);
      } else {
        // await sendSms(phone, smsText);
      }
    }
  } catch (err: any) {
    throw new Error(`Notification failed: ${err.message}`);
  }
}, { connection: redisConnection });

notificationWorker.on('failed', (job, err) => {
  console.error(`[Job] Notification failed for job ${job?.id}: ${err.message}`);
});

// Mock template engines
function getPushTitle(type: string, payload: any) {
  switch (type) {
    case 'booking_confirmed': return 'Booking Confirmed!';
    case 'job_assigned': return 'New Job Assigned';
    default: return 'Notification';
  }
}

function getPushBody(type: string, payload: any) {
  switch (type) {
    case 'booking_confirmed': return `Your booking ${payload.bookingId} is confirmed.`;
    case 'job_assigned': return `You have a new trip for ${payload.date}.`;
    default: return 'You have a new update.';
  }
}

function getSmsBody(type: string, payload: any) {
  return getPushBody(type, payload);
}
