/**
 * Triveni Driver Partner App — Unified Backend API Client
 * Connects Expo driver app to http://localhost:3001/api/v1 with auto vendor JWT,
 * GPS telemetry transmitter, live job fetching, and Google Maps navigation.
 */

import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookingStatus } from '@triveni/shared-types';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api/v1' : 'http://localhost:3001/api/v1');

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'triveni_driver_access_token',
  REFRESH_TOKEN: 'triveni_driver_refresh_token',
  USER_DATA: 'triveni_driver_user',
};

// ── Token Storage Helpers ──────────────────────────────────────────
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setTokens(access: string, refresh?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      if (refresh) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      }
    } catch (e) {
      console.warn('Error saving driver tokens:', e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (e) {
      console.warn('Error clearing driver tokens:', e);
    }
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
    const res = await fetch(url, { ...options, headers });

    if (res.status === 204) return {} as T;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, err?.code || 'API_ERROR', err?.message || res.statusText);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', error.message || 'Unable to connect to Triveni server');
  }
}

// ── Vendor Auth Service ────────────────────────────────────────────
export const driverAuthApi = {
  async requestOtp(phone: string) {
    return request<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role: 'vendor' }),
    });
  },

  async verifyOtp(phone: string, code: string) {
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      userId: string;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, role: 'vendor' }),
    });

    if (data.accessToken) {
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    }

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
  distanceKm?: number;
  finalAmount: number;
  customer?: { name: string; phone: string } | null;
  vehicle?: { type: string; registrationNumber: string } | null;
  pricingSnapshot?: any;
}

export const driverJobsApi = {
  async getJobs(dateStr?: string): Promise<BackendJob[]> {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    return request<BackendJob[]>(`/vendor/jobs${query}`);
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
