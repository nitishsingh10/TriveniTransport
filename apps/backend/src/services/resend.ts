import { Resend } from 'resend';
import { getEnv } from '../config/env';

export class EmailService {
  private static getResendClient(): Resend | null {
    const { RESEND_API_KEY } = getEnv();
    if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('your_') || RESEND_API_KEY.startsWith('mock_')) {
      return null;
    }
    return new Resend(RESEND_API_KEY);

  }

  static async sendEmail(to: string, subject: string, html: string, attachments?: any[], text?: string) {
    const resend = this.getResendClient();
    const { EMAIL_FROM } = getEnv();

    if (!resend) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MOCK EMAIL] Message skipped in development.');
        return { id: 'mock-email-id' };
      }
      throw new Error('Email delivery is unavailable. Please try again later.');
    }

    const from = `Triveni Transports <${EMAIL_FROM || 'bookings@trivenitransports.com'}>`;

    try {
      const response = await resend.emails.send({ from, to, subject, html, text, attachments });
      if (response.error) {
        throw new Error('Failed to send email');
      }
      return response;
    } catch {
      // Keep the sender identity stable; retrying with a different domain hurts trust.
    }

    console.error('Resend email delivery failed.');
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV FALLBACK] Continuing despite email delivery failure.');
      return { id: 'dev-fallback' };
    }
    throw new Error('Failed to send verification email');
  }

  /**
   * Sends an OTP verification email with a premium, email-client-safe layout.
   */
  static async sendOtpEmail(email: string, otp: string, role = 'customer', isSignup = false) {
    const roleLabel = role === 'admin' ? 'Admin Portal' : role === 'vendor' ? 'Partner Captain' : 'Customer Account';
    const actionLabel = isSignup ? 'complete your registration' : 'sign in to your account';
    const { OTP_EXPIRY_MINUTES } = getEnv();
    const subject = 'Your Triveni Transports verification code';
    const text = `Your Triveni Transports verification code is ${otp}.\n\nEnter this code to ${actionLabel} for your ${roleLabel}. It expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nNever share this code with anyone. If you did not request it, you can ignore this email.\n\nTriveni Transports Support\n+91 88286 47785 · support@trivenitransports.com`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @keyframes otpReveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .otp-reveal { animation: otpReveal 450ms ease-out both; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,Helvetica,sans-serif;color:#17212b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your Triveni sign-in code is ready. It expires in ${OTP_EXPIRY_MINUTES} minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="height:4px;background-color:#F7A300;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background-color:#ffffff;border-bottom:1px solid #edf0f2;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td width="48" valign="middle" style="width:48px;padding-right:10px;">
                    <img src="https://www.trivenitransport.online/logo-cropped.png" width="44" height="44" alt="Triveni Transports logo" style="display:block;width:44px;height:44px;border:0;">
                  </td>
                  <td valign="middle" align="center" style="font-family:Arial,Helvetica,sans-serif;text-align:center;">
                    <div style="font-size:19px;line-height:1.1;font-weight:900;letter-spacing:3px;color:#050d17;">TRIVENI</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 0;">
                      <tr>
                        <td style="width:12px;height:1px;background-color:#fbd38d;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="padding:0 7px;font-size:9px;line-height:1.3;font-weight:700;letter-spacing:2px;color:#0D1F37;">TRANSPORTS</td>
                        <td style="width:12px;height:1px;background-color:#fbd38d;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    <div style="margin-top:4px;font-size:7px;line-height:1.3;font-weight:700;letter-spacing:1px;color:#F7A300;">SAFE HANDS FOR YOUR SHIFTING PLANS</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 30px;">
              <p style="margin:0 0 9px;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c05621;">One-time passcode</p>
              <h1 style="margin:0 0 12px;font-size:25px;line-height:1.3;font-weight:700;color:#0D1F37;">Verify it’s you</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#526071;">
                Use this secure code to ${actionLabel} for your ${roleLabel}.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="otp-reveal" style="margin:0 0 20px;background-color:#0D1F37;border:1px solid #F7A300;border-radius:10px;">
                <tr>
                  <td align="center" style="padding:19px 12px 17px;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:35px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#F7A300;">${otp}</div>
                    <div style="margin-top:8px;font-size:10px;line-height:1.4;font-weight:600;letter-spacing:1.6px;color:#b6c0cb;">EXPIRES IN ${OTP_EXPIRY_MINUTES} MINUTES</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background-color:#fbf7ef;border-left:3px solid #F7A300;">
                <tr>
                  <td style="padding:13px 15px;font-size:13px;line-height:1.6;color:#62563f;"><span style="font-size:15px;color:#F7A300;">&#9670;</span>&nbsp;&nbsp;For your protection, never share this code with anyone. Our team will never ask you for it.</td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#687586;">
                Didn’t request a code? You can safely ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:19px 32px;background-color:#f8f9fb;border-top:1px solid #edf0f2;font-size:12px;line-height:1.7;color:#778392;">
              <strong style="color:#465364;">Triveni Transports</strong> &nbsp;·&nbsp; Thane West, Maharashtra<br>
              Need help? <a href="mailto:support@trivenitransports.com" style="color:#8b641e;text-decoration:underline;">support@trivenitransports.com</a> &nbsp;·&nbsp; +91 88286 47785
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
      subject,
      html,
      undefined,
      text
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
