/**
 * Triveni Customer Mobile App — Unified Backend API Client
 * Connects Expo app to http://localhost:3001/api/v1 with auto JWT attachment,
 * Google Maps proxy endpoints, and fallback safety.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo Web, localhost works. On physical device / simulator, user can set EXPO_PUBLIC_API_URL
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api/v1' : 'http://localhost:3001/api/v1');

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'triveni_customer_access_token',
  REFRESH_TOKEN: 'triveni_customer_refresh_token',
  USER_DATA: 'triveni_customer_user',
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
      console.warn('Error saving tokens:', e);
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
      console.warn('Error clearing tokens:', e);
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
    // Network connectivity issue
    throw new ApiError(0, 'NETWORK_ERROR', error.message || 'Unable to connect to Triveni server');
  }
}

// ── Google Maps & Location Service ─────────────────────────────────
export interface PlaceLocation {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  city: string;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

export const mapsApi = {
  /**
   * Search places using Google Places Autocomplete API via backend
   */
  async searchPlaces(query: string): Promise<PlaceLocation[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      return await request<PlaceLocation[]>(
        `/maps/places?input=${encodeURIComponent(query.trim())}`
      );
    } catch {
      return [];
    }
  },

  /**
   * Geocode an address to Lat/Lng
   */
  async geocode(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }> {
    try {
      return await request<{ lat: number; lng: number; formattedAddress: string }>(
        `/maps/geocode?address=${encodeURIComponent(address.trim())}`
      );
    } catch {
      return { lat: 18.5204, lng: 73.8567, formattedAddress: address };
    }
  },

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
    try {
      return await request<{ address: string; city: string }>(
        `/maps/reverse?lat=${lat}&lng=${lng}`
      );
    } catch {
      return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: 'Pune' };
    }
  },

  /**
   * Calculate driving distance and time between origin and destination
   */
  async getRouteEstimate(origin: string, destination: string): Promise<RouteEstimate> {
    try {
      return await request<RouteEstimate>(
        `/maps/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
    } catch {
      return { distanceKm: 14.5, durationMins: 38 };
    }
  },
};

// ── Auth Service ───────────────────────────────────────────────────
export const authApi = {
  async requestOtp(phone: string) {
    return request<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role: 'customer' }),
    });
  },

  async verifyOtp(phone: string, code: string) {
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      userId: string;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, role: 'customer' }),
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

// ── Quotes & Bookings Service ──────────────────────────────────────
export interface BookingItem {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  scheduledDate: string;
  scheduledSlot: string;
  configurationType: string;
  floorNumber: number;
  liftAvailable: boolean;
  distanceKm?: number;
  finalAmount: number;
  baseQuoteAmount: number;
  createdAt: string;
  vendor?: { id: string; name: string; phone: string } | null;
  vehicle?: { id: string; type: string; registrationNumber: string } | null;
}

export const bookingApi = {
  async list(): Promise<BookingItem[]> {
    try {
      return await request<BookingItem[]>('/bookings');
    } catch {
      return [];
    }
  },

  async get(id: string): Promise<BookingItem> {
    return request<BookingItem>(`/bookings/${id}`);
  },

  async getTelemetry(bookingId: string): Promise<{
    latitude: number;
    longitude: number;
    speedKmh: number;
    headingDeg: number;
    timestamp: string;
  }> {
    return request(`/bookings/${bookingId}/telemetry`);
  },

  async createBooking(body: {
    pickupAddress: string;
    dropAddress: string;
    configurationType: string;
    floorNumber: number;
    liftAvailable: boolean;
    scheduledDate: string;
    scheduledSlot: string;
    items: Array<{
      customName?: string | null;
      quantity: number;
      packingTier: 'lite' | 'standard' | 'premium';
    }>;
    addons?: string[];
  }) {
    return request<{ booking: BookingItem; quote: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        addons: body.addons || [],
      }),
    });
  },

  async holdSlot(bookingId: string) {
    return request<{ success: boolean; message: string }>(`/bookings/${bookingId}/hold`, {
      method: 'POST',
    });
  },

  async confirm(bookingId: string) {
    return request<BookingItem>(`/bookings/${bookingId}/confirm`, {
      method: 'POST',
    });
  },

  async cancel(bookingId: string) {
    return request<BookingItem>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },
};
