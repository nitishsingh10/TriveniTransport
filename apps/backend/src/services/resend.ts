import { Resend } from 'resend';
import { getEnv } from '../config/env';

export class EmailService {
  private static getResendClient(): Resend | null {
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
      return { id: 'mock-email-id' };
    }

    const defaultFrom = EMAIL_FROM || 'bookings@trivenipackers.com';

    try {
      const response = await resend.emails.send({
        from: defaultFrom,
        to,
        subject,
        html,
        attachments,
      });

      if (response.error) {
        console.warn(`Resend initial send failed (${response.error.message}). Retrying via onboarding@resend.dev...`);
        // If custom domain is not yet verified in Resend, fallback to verified sandbox sender
        const fallbackResponse = await resend.emails.send({
          from: 'Triveni Transports <onboarding@resend.dev>',
          to,
          subject,
          html,
          attachments,
        });
        return fallbackResponse;
      }

      return response;
    } catch (error: any) {
      console.warn('Resend send exception, attempting fallback sender:', error?.message);
      try {
        const fallbackResponse = await resend.emails.send({
          from: 'Triveni Transports <onboarding@resend.dev>',
          to,
          subject,
          html,
          attachments,
        });
        return fallbackResponse;
      } catch (innerError) {
        console.error('Resend Email Error (both custom and fallback failed):', innerError);
        // Do not crash the entire auth flow if email provider fails in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV FALLBACK] Continuing despite Resend error. Destination: ${to}`);
          return { id: 'dev-fallback' };
        }
        throw new Error('Failed to send verification email');
      }
    }
  }

  /**
   * Sends an OTP verification email with Triveni luxury brand styling
   */
  static async sendOtpEmail(email: string, otp: string, role = 'customer', isSignup = false) {
    const roleLabel = role === 'admin' ? 'Admin Portal' : role === 'vendor' ? 'Partner Captain' : 'Customer Account';
    const actionLabel = isSignup ? 'complete your registration' : 'sign in to your account';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Triveni Transports Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#070F1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070F1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#0D1F37;border:1px solid rgba(255,255,255,0.1);border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(180deg,#132845 0%,#0D1F37 100%);border-bottom:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:24px;font-weight:800;letter-spacing:2px;color:#FFFFFF;">
                TRIVENI <span style="color:#F7A300;">TRANSPORTS</span>
              </div>
              <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.6);margin-top:4px;">
                SAFE HANDS FOR YOUR SHIFTING PLANS
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 32px;text-align:center;">
              <div style="font-size:18px;font-weight:700;color:#FFFFFF;margin-bottom:8px;">
                Your Verification Code
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:28px;">
                Enter this 6-digit code to ${actionLabel} for your <strong>${roleLabel}</strong>.
              </div>

              <!-- OTP Box -->
              <div style="display:inline-block;background:#050D17;border:2px solid #F7A300;border-radius:14px;padding:18px 36px;margin:0 auto 24px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#F7A300;margin-left:10px;">
                  ${otp}
                </span>
              </div>

              <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:24px;">
                ⏱️ This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.
              </div>

              <div style="height:1px;background-color:rgba(255,255,255,0.08);margin:24px 0;"></div>

              <div style="font-size:11.5px;color:rgba(255,255,255,0.5);line-height:1.5;text-align:left;">
                🔒 <strong>Security Tip:</strong> Triveni Transports staff or drivers will never call to ask for your verification code. If you did not request this OTP, you can safely disregard this email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#050D17;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">
                Triveni Transports Packers &amp; Movers • Thane West, Mumbai, Maharashtra<br>
                Support Helpline: +91 88286 47785 • support@trivenitransports.com
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendEmail(
      email,
      `${otp} is your Triveni Transports verification code`,
      html
    );
  }

  /**
   * Sends a booking confirmation transactional email
   */
  static async sendBookingConfirmationEmail(
    email: string,
    details: {
      bookingId: string;
      pickupAddress: string;
      dropAddress: string;
      scheduledDate: Date | string;
      amount?: number | null;
    }
  ) {
    const formattedDate = new Date(details.scheduledDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmed — Triveni Transports</title>
</head>
<body style="margin:0;padding:0;background-color:#070F1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070F1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#0D1F37;border:1px solid rgba(255,255,255,0.1);border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding:28px 32px;text-align:center;background:linear-gradient(180deg,#132845 0%,#0D1F37 100%);border-bottom:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#FFFFFF;">
                TRIVENI <span style="color:#F7A300;">TRANSPORTS</span>
              </div>
              <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.6);margin-top:4px;">
                MOVE CONFIRMED &amp; SCHEDULED
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:18px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">
                Your move is confirmed! 🎉
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:20px;">
                Booking ID: <strong>${details.bookingId}</strong>
              </div>

              <div style="background:#050D17;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:12px;color:#F7A300;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Scheduled Date</div>
                <div style="font-size:14px;color:#FFFFFF;font-weight:600;margin-bottom:16px;">${formattedDate}</div>

                <div style="font-size:12px;color:#94A3B8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Pickup Location</div>
                <div style="font-size:13px;color:#FFFFFF;margin-bottom:16px;">📍 ${details.pickupAddress}</div>

                <div style="font-size:12px;color:#94A3B8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Drop Location</div>
                <div style="font-size:13px;color:#FFFFFF;margin-bottom:16px;">🏁 ${details.dropAddress}</div>

                ${details.amount ? `
                <div style="font-size:12px;color:#94A3B8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Total Estimated Fare</div>
                <div style="font-size:16px;color:#10B981;font-weight:800;">₹${details.amount.toLocaleString('en-IN')}</div>
                ` : ''}
              </div>

              <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;">
                🛡️ Your move is covered with <strong>₹5L Transit Insurance</strong>. Your assigned moving captain will contact you 24 hours prior to departure.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background-color:#050D17;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:11px;color:rgba(255,255,255,0.45);">
                Triveni Transports • 24/7 Support: +91 88286 47785 • support@trivenitransports.com
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendEmail(email, `Booking Confirmed #${details.bookingId.slice(0, 8).toUpperCase()} — Triveni Transports`, html);
  }

  static async sendAdminAlert(subject: string, message: string) {
    const adminEmail = 'admin@trivenitransports.com';
    return this.sendEmail(adminEmail, `[ALERT] ${subject}`, `<p>${message}</p>`);
  }
}
