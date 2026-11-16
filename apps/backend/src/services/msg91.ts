import axios from 'axios';
import { getEnv } from '../config/env';

function isPlaceholderCredential(value?: string): boolean {
  return !value || value.startsWith('your_') || value.startsWith('mock_');
}

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_SENDER_ID } = getEnv();

  if (isPlaceholderCredential(MSG91_API_KEY)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MOCK MSG91] Generated OTP ${otp} for ${phone}`);
      return;
    }
    throw new Error('SMS verification is unavailable. Please try again later.');
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  try {
    const res = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {},
      {
        params: {
          authkey: MSG91_API_KEY,
          mobile,
          otp,
          sender: MSG91_SENDER_ID,
          template_id: 'default',
        },
      }
    );
    if (res.data?.type === 'error') {
      throw new Error('SMS provider rejected the verification request.');
    }
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('MSG91 OTP delivery failed.', status ? `HTTP ${status}` : '');
    throw new Error('Failed to send verification SMS. Please try again later.');
  }
}

export async function sendSmsMessage(phone: string, message: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_SENDER_ID } = getEnv();
  const isMockMode = isPlaceholderCredential(MSG91_API_KEY);

  if (isMockMode) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOCK MSG91 SMS] Message skipped in development.');
      return;
    }
    throw new Error('SMS delivery is unavailable. Please try again later.');
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
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('MSG91 SMS delivery failed.', status ? `HTTP ${status}` : '');
    throw new Error('Failed to send SMS. Please try again later.');
  }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const { MSG91_API_KEY, MSG91_WHATSAPP_NUMBER } = getEnv();
  const isMockMode = isPlaceholderCredential(MSG91_API_KEY);

  if (isMockMode) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MOCK MSG91 WhatsApp] Message skipped in development.');
      return;
    }
    throw new Error('WhatsApp delivery is unavailable. Please try again later.');
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
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('MSG91 WhatsApp delivery failed.', status ? `HTTP ${status}` : '');
    throw new Error('Failed to send WhatsApp message. Please try again later.');
  }
}
