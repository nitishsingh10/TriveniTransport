import { Resend } from 'resend';
import { getEnv } from '../config/env';

export class EmailService {
  private static getResendClient() {
    const { RESEND_API_KEY } = getEnv();
    if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('your_')) {
      return null;
    }
    return new Resend(RESEND_API_KEY);
  }

  static async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
    const resend = this.getResendClient();
    const { EMAIL_FROM } = getEnv();

    if (!resend) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM || 'bookings@trivenipackers.com',
        to,
        subject,
        html,
        attachments,
      });
      return response;
    } catch (error) {
      console.error('Resend Email Error:', error);
      throw new Error('Failed to send email');
    }
  }

  static async sendAdminAlert(subject: string, message: string) {
    // Hardcoded for now based on assumption, could come from env
    const adminEmail = 'admin@trivenitransports.com';
    return this.sendEmail(adminEmail, `[ALERT] ${subject}`, `<p>${message}</p>`);
  }
}
