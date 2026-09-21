import { Worker } from 'bullmq';
import { redisConnection } from '../queue';
import { PushNotificationService } from '../../services/expo';
import { EmailService } from '../../services/resend';
import { NotificationTemplates } from '../../modules/notifications/templates';
import { prisma } from '../../config/prisma';

export const notificationWorker = new Worker('notifications', async job => {
  const { type, userId, userRole, payload, bookingId } = job.data;
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
  // Assume basic opt-ins for this spec; in a real app, read from preferences table
  const pushOptIn = true; 
  const whatsappOptIn = true;
  const email = user.email; // assuming email field exists or is populated

  try {
    let sentPush = false;
    let sentWhatsapp = false;

    // 1. PUSH NOTIFICATION
    if (pushToken && pushOptIn && NotificationTemplates.push[type as keyof typeof NotificationTemplates.push]) {
      const tpl = NotificationTemplates.push[type as keyof typeof NotificationTemplates.push];
      // @ts-ignore
      const title = tpl.title({ ...payload, name: user.name });
      // @ts-ignore
      const body = tpl.body({ ...payload, name: user.name });
      
      await PushNotificationService.sendPush(pushToken, title, body, payload);
      sentPush = true;
      console.log(`[Job] Push sent to ${pushToken}`);
    }

    // 2. WHATSAPP (Primary SMS alternative)
    if (phone && whatsappOptIn && !sentPush && NotificationTemplates.whatsapp[type as keyof typeof NotificationTemplates.whatsapp]) {
      const tpl = NotificationTemplates.whatsapp[type as keyof typeof NotificationTemplates.whatsapp];
      // @ts-ignore
      const message = tpl({ ...payload, name: user.name });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MOCK MSG91 WhatsApp] To: ${phone} | Text: ${message}`);
      }
      sentWhatsapp = true;
    }

    // 3. SMS (Fallback)
    if (phone && !sentPush && !sentWhatsapp && NotificationTemplates.sms[type as keyof typeof NotificationTemplates.sms]) {
      const tpl = NotificationTemplates.sms[type as keyof typeof NotificationTemplates.sms];
      // @ts-ignore
      const message = tpl({ ...payload, name: user.name });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MOCK MSG91 SMS Fallback] To: ${phone} | Text: ${message}`);
      }
    }

    // 4. EMAIL (Always send if applicable and email is present)
    if (email) {
      const subjectMap: Record<string, string> = {
        'booking_confirmed': 'Your Booking is Confirmed',
        'job_assigned': 'New Job Assignment',
      };
      const subject = subjectMap[type] || 'Update from Triveni Transports';
      const html = `<p>Hello ${user.name},</p><p>You have a new update regarding your booking.</p>`;
      
      await EmailService.sendEmail(email, subject, html);
    }

    // 5. Audit Log Delivery
    await prisma.notification.create({
      data: {
        bookingId: bookingId || null,
        recipientRole: userRole,
        channel: sentPush ? 'push' : (sentWhatsapp ? 'whatsapp' : 'sms'),
        template: type,
        payload: payload,
        status: 'sent'
      }
    });

  } catch (err: any) {
    // Audit log failure
    await prisma.notification.create({
      data: {
        bookingId: bookingId || null,
        recipientRole: userRole,
        channel: 'sms', // assume fallback failed
        template: type,
        payload: payload,
        status: 'failed'
      }
    });
    // Send admin alert on failure
    await EmailService.sendAdminAlert(`Notification Failed: ${type}`, err.message);
    throw new Error(`Notification failed: ${err.message}`);
  }
}, { connection: redisConnection });

notificationWorker.on('failed', (job, err) => {
  console.error(`[Job] Notification failed for job ${job?.id}: ${err.message}`);
});
