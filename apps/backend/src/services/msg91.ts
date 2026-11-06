import axios from 'axios';
import { getEnv } from '../config/env';

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_SENDER_ID } = getEnv();
  
  const isMockMode = !MSG91_API_KEY || MSG91_API_KEY.startsWith('your_') || MSG91_API_KEY.startsWith('mock_');
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
          template_id: 'default',
        },
      }
    );
    console.log(`✅ MSG91 OTP sent to ${phone}`);
  } catch (error: any) {
    console.error('❌ MSG91 OTP Error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP via SMS');
  }
}

export async function sendSmsMessage(phone: string, message: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_SENDER_ID } = getEnv();
  const isMockMode = !MSG91_API_KEY || MSG91_API_KEY.startsWith('your_') || MSG91_API_KEY.startsWith('mock_');

  if (isMockMode) {
    console.log(`[MOCK MSG91 SMS] To: ${phone} | Text: ${message}`);
    return;
  }

  try {
    await axios.post(
      'https://control.msg91.com/api/v5/flow',
      {
        sender: MSG91_SENDER_ID,
        mobiles: phone,
        message,
      },
      {
        headers: {
          authkey: MSG91_API_KEY,
          'content-type': 'application/json',
        },
      }
    );
    console.log(`✅ MSG91 SMS sent to ${phone}`);
  } catch (error: any) {
    console.error('❌ MSG91 SMS Send Error:', error.response?.data || error.message);
  }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_WHATSAPP_NUMBER } = getEnv();
  const isMockMode = !MSG91_API_KEY || MSG91_API_KEY.startsWith('your_') || MSG91_API_KEY.startsWith('mock_');

  if (isMockMode) {
    console.log(`[MOCK MSG91 WhatsApp] To: ${phone} | Text: ${message}`);
    return;
  }

  try {
    await axios.post(
      'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
      {
        integrated_number: MSG91_WHATSAPP_NUMBER,
        content_type: 'text',
        payload: {
          to: phone,
          type: 'text',
          text: { body: message },
        },
      },
      {
        headers: {
          authkey: MSG91_API_KEY,
          'content-type': 'application/json',
        },
      }
    );
    console.log(`✅ MSG91 WhatsApp sent to ${phone}`);
  } catch (error: any) {
    console.error('❌ MSG91 WhatsApp Send Error:', error.response?.data || error.message);
  }
}
