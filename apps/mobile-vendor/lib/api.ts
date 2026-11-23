import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { File } from 'expo-file-system';

const getBaseUrl = () => {
  let url = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (!url) {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:3001/api/v1`;
    return 'https://api.trivenitransport.online/api/v1';
  }
  if (!url.endsWith('/api/v1')) url += '/api/v1';
  return url;
};

const BASE_URL = getBaseUrl();
const ACCESS_KEY = 'triveni_pnm_vendor_access';
const REFRESH_KEY = 'triveni_pnm_vendor_refresh';
const readSecret = (key: string) => Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
const writeSecret = (key: string, value: string) => Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
const deleteSecret = (key: string) => Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let accessToken = await readSecret(ACCESS_KEY);
  const send = (token: string | null) => fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers as Record<string, string> | undefined) },
  });
  let response = await send(accessToken);
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshToken = await readSecret(REFRESH_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => null);
      const session = refreshed?.ok ? await refreshed.json().catch(() => null) : null;
      if (typeof session?.accessToken === 'string' && typeof session?.refreshToken === 'string') {
        accessToken = session.accessToken;
        await saveSession(session.accessToken, session.refreshToken);
        response = await send(accessToken);
      } else {
        await clearSession();
      }
    }
  }
  if (response.status === 204) return {} as T;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || result?.message || response.statusText || 'Request failed.');
  return result as T;
}

export async function saveSession(accessToken: string, refreshToken: string) {
  await Promise.all([writeSecret(ACCESS_KEY, accessToken), writeSecret(REFRESH_KEY, refreshToken)]);
}

export async function clearSession() {
  await Promise.all([deleteSecret(ACCESS_KEY), deleteSecret(REFRESH_KEY)]);
}

export async function hasSession() {
  return Boolean(await readSecret(ACCESS_KEY));
}

export type PartnerContract = {
  version: string; hash: string; text: string;
  signature: null | { signerName: string; signerRole: string; signatureText: string; signedAt: string; contractHash: string };
};

export const pnmApi = {
  requestOtp(identifier: string, signup: boolean, name?: string) {
    const isEmail = identifier.includes('@');
    return request<{ message: string }>('/auth/otp/request', { method: 'POST', body: JSON.stringify({ identifier, ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }), role: 'vendor', serviceType: 'packers_movers', isSignup: signup, name }) });
  },
  verifyOtp(identifier: string, code: string, signup: boolean, name?: string) {
    const isEmail = identifier.includes('@');
    return request<{ accessToken: string; refreshToken: string; user?: { id: string; role: string; name: string } }>('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ identifier, ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }), code, role: 'vendor', serviceType: 'packers_movers', isSignup: signup, name }) });
  },
  getProfile: () => request<{ serviceType: string; status: string; onboardingStatus: string; onboardingData?: Record<string, any>; documents?: Array<{ documentType: string; fileName: string; status: string }>; reviewNotes?: string | null }>('/vendor/profile'),
  getContract: () => request<PartnerContract>('/vendor/partner-contract'),
  getJobs: () => request<any[]>('/vendor/jobs'),
  getSupervisors: () => request<Array<{ id: string; name: string; phone: string; status: 'invited' | 'active' | 'suspended'; phoneVerifiedAt?: string | null }>>('/vendor/supervisors'),
  addSupervisor: (name: string, phone: string) => request<{ id: string; name: string; phone: string; status: 'invited' | 'active' | 'suspended'; phoneVerifiedAt?: string | null }>('/vendor/supervisors', { method: 'POST', body: JSON.stringify({ name, phone }) }),
  revokeSupervisor: (id: string) => request(`/vendor/supervisors/${id}/revoke`, { method: 'PATCH' }),
  assignSupervisor: (bookingId: string, supervisorId: string | null) => request(`/vendor/bookings/${bookingId}/supervisor`, { method: 'POST', body: JSON.stringify({ supervisorId }) }),
  requestSigningOtp: () => request<{ destination: string; channel: string }>('/vendor/partner-contract/otp', { method: 'POST' }),
  signContract: (body: { version: string; hash: string; signerName: string; signerRole: string; signatureText: string; otp: string; acceptTerms: true }) => request<{ signed: boolean }>('/vendor/partner-contract/sign', { method: 'POST', body: JSON.stringify(body) }),
  async uploadDocument(documentType: string, asset: { uri: string; name: string; mimeType?: string; size?: number }) {
    const file = new File(asset.uri);
    if (!file.exists || !file.size) throw new Error('The selected file is unavailable. Please select it again.');
    const mimeType = asset.mimeType || file.type || 'application/octet-stream';
    const fileName = asset.name || file.name || `${documentType}.pdf`;
    const signed = await request<{ uploadUrl: string; objectKey: string; maxBytes: number }>('/vendor/documents/presign', { method: 'POST', body: JSON.stringify({ documentType, fileName, mimeType, size: file.size }) });
    if (file.size > signed.maxBytes) throw new Error('Each document must be 10 MB or smaller.');
    const uploaded = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mimeType }, body: file as unknown as BodyInit });
    if (!uploaded.ok) throw new Error('Secure upload failed. Please try again.');
    return request('/vendor/documents/complete', { method: 'POST', body: JSON.stringify({ documentType, fileName, mimeType, objectKey: signed.objectKey }) });
  },
  submitOnboarding(data: Record<string, unknown>) {
    return request<{ onboardingStatus: string }>('/vendor/onboarding', { method: 'POST', body: JSON.stringify({ ...data, serviceType: 'packers_movers' }) });
  },
};
