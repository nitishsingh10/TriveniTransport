/**
 * Triveni Driver Partner App — Unified Backend API Client
 * Connects Expo driver app to http://localhost:3001/api/v1 with auto vendor JWT,
 * GPS telemetry transmitter, live job fetching, and Google Maps navigation.
 */

import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import type { BookingStatus } from '@triveni/shared-types';

// Auto-detect development machine LAN IP when running in Expo Go on a local machine,
// or fallback cleanly to the official production API server for standalone APK and device builds.
const getBaseUrl = (): string => {
  let url = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

  // If unset, detect whether we are running inside Expo Go with a live development host
  if (!url) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3001/api/v1`;
      }
    }
    // Standalone APK or production release fallback
    return 'https://api.trivenitransport.online/api/v1';
  }

  // If explicitly pointing to loopback on a physical device
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3001/api/v1`;
      }
    }
  }

  // Ensure /api/v1 suffix is present
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

const BASE_URL = getBaseUrl();

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'triveni_driver_access_token',
  REFRESH_TOKEN: 'triveni_driver_refresh_token',
  USER_DATA: 'triveni_driver_user',
};

async function getSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  const secureValue = await SecureStore.getItemAsync(key);
  if (secureValue !== null) return secureValue;
  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue !== null) {
    await SecureStore.setItemAsync(key, legacyValue);
    await AsyncStorage.removeItem(key);
  }
  return legacyValue;
}

async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
  await AsyncStorage.removeItem(key);
}

async function removeSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await Promise.all([SecureStore.deleteItemAsync(key), AsyncStorage.removeItem(key)]);
}

// ── Token Storage Helpers ──────────────────────────────────────────
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return getSecret(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getSecret(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async getUser<T = any>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    if (user) await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    else await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  async setTokens(access: string, refresh?: string): Promise<void> {
    try {
      await setSecret(STORAGE_KEYS.ACCESS_TOKEN, access);
      if (refresh) await setSecret(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      else await removeSecret(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      await tokenStorage.clear().catch(() => {});
      throw error;
    }
  },

  async clear(): Promise<void> {
    await Promise.all([
      removeSecret(STORAGE_KEYS.ACCESS_TOKEN),
      removeSecret(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
  },
};

// ── Core API Fetcher ───────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let sessionExpiredHandler: (() => void) | null = null;
let refreshInFlight: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

export function setSessionExpiredHandler(handler: () => void): void {
  sessionExpiredHandler = handler;
}

async function refreshSession(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.status === 401) {
          await tokenStorage.clear();
          sessionExpiredHandler?.();
          return null;
        }
        if (!refreshRes.ok) return null;
        const data = await refreshRes.json();
        if (typeof data?.accessToken !== 'string' || typeof data?.refreshToken !== 'string') return null;
        await tokenStorage.setTokens(data.accessToken, data.refreshToken);
        return { accessToken: data.accessToken, refreshToken: data.refreshToken };
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const url = `${BASE_URL}${path}`;

  try {
    let res = await fetch(url, { ...options, headers });

    // Handle token expiration: attempt automatic refresh once
    if (res.status === 401 && !path.startsWith('/auth/')) {
      const refreshed = await refreshSession();
      if (refreshed) {
        headers.Authorization = `Bearer ${refreshed.accessToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }

    if (res.status === 204) return {} as T;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const payload = err?.error ?? err;
      throw new ApiError(res.status, payload?.code || 'API_ERROR', payload?.message || res.statusText);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', error.message || 'Unable to connect to Triveni server');
  }
}

// ── Vendor Auth Service ────────────────────────────────────────────
export const driverAuthApi = {
  async requestOtp(identifier: string, isSignup = false) {
    const isEmail = identifier.includes('@');
    return request<{ message: string; channel?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }),
        role: 'vendor',
        serviceType: 'transport',
        isSignup,
      }),
    });
  },

  async verifyOtp(identifier: string, code: string, isSignup = false, name?: string) {
    const isEmail = identifier.includes('@');
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      user?: { id: string; role: string; name: string; phone?: string; email?: string };
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }),
        code,
        role: 'vendor',
        serviceType: 'transport',
        isSignup,
        ...(name?.trim() ? { name: name.trim() } : {}),
      }),
    });

    return data;
  },

  async logout() {
    const refreshToken = await tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      await tokenStorage.clear();
    }
  },
};

// ── Vendor Jobs & Status Service ───────────────────────────────────
export interface BackendJob {
  id: string;
  status: BookingStatus;
  pickupAddress: string;
  dropAddress: string;
  scheduledDate: string;
  scheduledSlot: string;
  distanceKm?: number | string;
  finalAmount: number | string;
  configurationType?: string;
  floorNumber?: number;
  liftAvailable?: boolean;
  customer?: { name: string; phone: string } | null;
  vehicle?: { type: string; registrationNumber: string } | null;
  items?: Array<{ quantity: number }>;
  pricingSnapshot?: any;
}

export interface BackendVehicle {
  id: string;
  type: string;
  registrationNumber: string;
  capacityCft: number | string;
  permitExpiry?: string;
  fitnessCertExpiry?: string;
  active: boolean;
}

export interface BackendVendorProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  onboardingStatus: string;
  onboardingData?: Record<string, any>;
  reviewNotes?: string | null;
  vehicles: BackendVehicle[];
  _count?: { bookings: number };
}

export const driverVendorApi = {
  async getProfile(): Promise<BackendVendorProfile> {
    return request<BackendVendorProfile>('/vendor/profile');
  },
  async getVehicles(): Promise<BackendVehicle[]> {
    return request<BackendVehicle[]>('/vendor/vehicles');
  },
  async saveOnboarding(data: {
    driver: object;
    vehicle: object;
    bank: object;
    agreementAccepted: boolean;
  }) {
    return request<{ success: boolean; message: string; vehicle: BackendVehicle }>('/vendor/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async uploadDocument(documentType: string, uri: string) {
    const file = new File(uri);
    if (!file.exists || !file.size) throw new Error('The selected document is unavailable. Please select it again.');
    const extension = file.extension.toLowerCase();
    const mimeType = file.type || ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }[extension] || 'image/jpeg');
    const fileName = file.name || `${documentType}${extension || '.jpg'}`;
    const presigned = await request<{ uploadUrl: string; objectKey: string }>('/vendor/documents/presign', {
      method: 'POST',
      body: JSON.stringify({ documentType, fileName, mimeType, size: file.size }),
    });
    const uploaded = await expoFetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: file,
    });
    if (!uploaded.ok) throw new Error(`Could not upload ${documentType.replaceAll('_', ' ')}.`);
    return request('/vendor/documents/complete', {
      method: 'POST',
      body: JSON.stringify({ documentType, fileName, mimeType, objectKey: presigned.objectKey }),
    });
  },
  async updatePushToken(pushToken: string | null): Promise<void> {
    await request<void>('/vendor/push-token', {
      method: 'PATCH',
      body: JSON.stringify({ pushToken }),
    });
  },
};

export const driverJobsApi = {
  async getJobs(dateStr?: string): Promise<BackendJob[]> {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    return request<BackendJob[]>(`/vendor/jobs${query}`);
  },

  async acceptJob(bookingId: string): Promise<BackendJob> {
    return request<BackendJob>(`/vendor/jobs/${bookingId}/accept`, {
      method: 'POST',
    });
  },

  async updateJobStatus(bookingId: string, status: BookingStatus) {
    return request(`/vendor/jobs/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async pushTelemetry(
    bookingId: string,
    coords: { latitude: number; longitude: number; speedKmh: number; headingDeg: number }
  ) {
    return request(`/vendor/jobs/${bookingId}/telemetry`, {
      method: 'POST',
      body: JSON.stringify(coords),
    });
  },
};

// ── Google Maps & Navigation Service ───────────────────────────────
export const driverMapsApi = {
  async geocode(address: string) {
    return request<{ lat: number; lng: number; formattedAddress: string }>(
      `/maps/geocode?address=${encodeURIComponent(address)}`
    );
  },

  async getRouteEstimate(origin: string, destination: string) {
    return request<{ distanceKm: number; durationMins: number }>(
      `/maps/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
  },

  /**
   * Launch native Google Maps Turn-by-Turn Navigation
   */
  openNavigation(destinationAddress: string, lat?: number, lng?: number) {
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(destinationAddress);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
    Linking.openURL(googleMapsUrl).catch((err) =>
      console.warn('Could not launch Google Maps navigation:', err)
    );
  },
};
