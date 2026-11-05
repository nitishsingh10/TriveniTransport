import axios from 'axios';
import { getEnv } from '../config/env';

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_SENDER_ID } = getEnv();
  
  const isMockMode = !MSG91_API_KEY || MSG91_API_KEY.startsWith('your_');
  if (isMockMode) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MOCK MSG91] Generated OTP ${otp} for ${phone}`);
    }
    return;
  }

  try {
    await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {},
      {
        params: {
          authkey: MSG91_API_KEY,
          mobile: phone,
          otp,
          sender: MSG91_SENDER_ID,
          template_id: 'default', // Configure this in MSG91 dashboard
        },
      }
    );
    console.log(`✅ MSG91 OTP sent to ${phone}`);
  } catch (error: any) {
    console.error('❌ MSG91 OTP Error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP via SMS');
  }
}
