/**
 * Triveni Customer Mobile App — Unified Backend API Client
 * Connects Expo app to http://localhost:3001/api/v1 with auto JWT attachment,
 * Google Maps proxy endpoints, and fallback safety.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

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
  ACCESS_TOKEN: 'triveni_customer_access_token',
  REFRESH_TOKEN: 'triveni_customer_refresh_token',
  USER_DATA: 'triveni_customer_user',
};

async function getSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);

  const secureValue = await SecureStore.getItemAsync(key);
  if (secureValue !== null) return secureValue;

  // Migrate credentials from older app versions that stored tokens in AsyncStorage.
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

export const CURATED_LOCATIONS: PlaceLocation[] = [
  // Pune & PCMC
  { placeId: 'pune_viman', description: 'Viman Nagar, Pune, Maharashtra, India', mainText: 'Viman Nagar', secondaryText: 'Pune, Maharashtra', lat: 18.5679, lng: 73.9143, city: 'Pune' },
  { placeId: 'pune_baner', description: 'Baner, Pune, Maharashtra, India', mainText: 'Baner', secondaryText: 'Pune, Maharashtra', lat: 18.5590, lng: 73.7868, city: 'Pune' },
  { placeId: 'pune_kothrud', description: 'Kothrud, Pune, Maharashtra, India', mainText: 'Kothrud', secondaryText: 'Pune, Maharashtra', lat: 18.5074, lng: 73.8077, city: 'Pune' },
  { placeId: 'pune_hinjewadi', description: 'Hinjewadi Phase 1, Pune, Maharashtra, India', mainText: 'Hinjewadi Phase 1', secondaryText: 'Pune, Maharashtra', lat: 18.5913, lng: 73.7389, city: 'Pune' },
  { placeId: 'pune_kharadi', description: 'Kharadi, Pune, Maharashtra, India', mainText: 'Kharadi', secondaryText: 'Pune, Maharashtra', lat: 18.5514, lng: 73.9348, city: 'Pune' },
  { placeId: 'pune_wakad', description: 'Wakad, Pune, Maharashtra, India', mainText: 'Wakad', secondaryText: 'Pune, Maharashtra', lat: 18.5987, lng: 73.7661, city: 'Pune' },
  { placeId: 'pune_aundh', description: 'Aundh, Pune, Maharashtra, India', mainText: 'Aundh', secondaryText: 'Pune, Maharashtra', lat: 18.5580, lng: 73.8075, city: 'Pune' },
  { placeId: 'pune_magarpatta', description: 'Magarpatta City, Hadapsar, Pune, Maharashtra', mainText: 'Magarpatta City', secondaryText: 'Hadapsar, Pune', lat: 18.5158, lng: 73.9272, city: 'Pune' },
  { placeId: 'pune_hadapsar', description: 'Hadapsar, Pune, Maharashtra, India', mainText: 'Hadapsar', secondaryText: 'Pune, Maharashtra', lat: 18.5089, lng: 73.9259, city: 'Pune' },
  { placeId: 'pune_koregaon', description: 'Koregaon Park, Pune, Maharashtra, India', mainText: 'Koregaon Park', secondaryText: 'Pune, Maharashtra', lat: 18.5362, lng: 73.8940, city: 'Pune' },
  { placeId: 'pune_shivajinagar', description: 'Shivaji Nagar, Pune, Maharashtra, India', mainText: 'Shivaji Nagar', secondaryText: 'Pune, Maharashtra', lat: 18.5314, lng: 73.8446, city: 'Pune' },
  { placeId: 'pune_pimpri', description: 'Pimpri Colony, Pimpri-Chinchwad, Pune, Maharashtra', mainText: 'Pimpri Colony', secondaryText: 'PCMC, Pune', lat: 18.6279, lng: 73.8009, city: 'Pune' },
  // Mumbai & MMR
  { placeId: 'mum_bandra', description: 'Bandra West, Mumbai, Maharashtra, India', mainText: 'Bandra West', secondaryText: 'Mumbai, Maharashtra', lat: 19.0596, lng: 72.8295, city: 'Mumbai' },
  { placeId: 'mum_powai', description: 'Powai, Mumbai, Maharashtra, India', mainText: 'Powai', secondaryText: 'Mumbai, Maharashtra', lat: 19.1176, lng: 72.9060, city: 'Mumbai' },
  { placeId: 'mum_thane', description: 'Thane West, Thane, Maharashtra, India', mainText: 'Thane West', secondaryText: 'Thane, Maharashtra', lat: 19.2183, lng: 72.9781, city: 'Thane' },
  { placeId: 'mum_andheri', description: 'Andheri East, Mumbai, Maharashtra, India', mainText: 'Andheri East', secondaryText: 'Mumbai, Maharashtra', lat: 19.1136, lng: 72.8697, city: 'Mumbai' },
  { placeId: 'mum_bkc', description: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra', mainText: 'BKC', secondaryText: 'Bandra, Mumbai', lat: 19.0657, lng: 72.8687, city: 'Mumbai' },
  { placeId: 'mum_vashi', description: 'Vashi, Navi Mumbai, Maharashtra, India', mainText: 'Vashi', secondaryText: 'Navi Mumbai, Maharashtra', lat: 19.0771, lng: 72.9986, city: 'Navi Mumbai' },
  { placeId: 'mum_borivali', description: 'Borivali West, Mumbai, Maharashtra, India', mainText: 'Borivali West', secondaryText: 'Mumbai, Maharashtra', lat: 19.2307, lng: 72.8567, city: 'Mumbai' },
  { placeId: 'mum_dadar', description: 'Dadar, Mumbai, Maharashtra, India', mainText: 'Dadar', secondaryText: 'Mumbai, Maharashtra', lat: 19.0178, lng: 72.8478, city: 'Mumbai' },
  { placeId: 'mum_juhu', description: 'Juhu, Mumbai, Maharashtra, India', mainText: 'Juhu', secondaryText: 'Mumbai, Maharashtra', lat: 19.1075, lng: 72.8263, city: 'Mumbai' },
  // Bengaluru
  { placeId: 'blr_whitefield', description: 'Whitefield, Bengaluru, Karnataka, India', mainText: 'Whitefield', secondaryText: 'Bengaluru, Karnataka', lat: 12.9698, lng: 77.7500, city: 'Bengaluru' },
  { placeId: 'blr_indiranagar', description: 'Indiranagar, Bengaluru, Karnataka, India', mainText: 'Indiranagar', secondaryText: 'Bengaluru, Karnataka', lat: 12.9784, lng: 77.6408, city: 'Bengaluru' },
  { placeId: 'blr_koramangala', description: 'Koramangala, Bengaluru, Karnataka, India', mainText: 'Koramangala', secondaryText: 'Bengaluru, Karnataka', lat: 12.9352, lng: 77.6245, city: 'Bengaluru' },
  { placeId: 'blr_hsr', description: 'HSR Layout, Bengaluru, Karnataka, India', mainText: 'HSR Layout', secondaryText: 'Bengaluru, Karnataka', lat: 12.9121, lng: 77.6446, city: 'Bengaluru' },
  { placeId: 'blr_ecity', description: 'Electronic City, Bengaluru, Karnataka, India', mainText: 'Electronic City', secondaryText: 'Bengaluru, Karnataka', lat: 12.8452, lng: 77.6602, city: 'Bengaluru' },
];

export const mapsApi = {
  /**
   * Fast synchronous match against curated cities and hubs (0ms latency)
   */
  getLocalMatches(query: string): PlaceLocation[] {
    const q = (query || '').trim().toLowerCase();
    if (q.length < 2) return [];
    return CURATED_LOCATIONS.filter(
      (loc) =>
        loc.description.toLowerCase().includes(q) ||
        loc.mainText.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q)
    );
  },

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
  async requestOtp(identifier: string, isSignup = false) {
    const isEmail = identifier.includes('@');
    return request<{ message: string; channel?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }),
        role: 'customer',
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
        role: 'customer',
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

export interface CatalogApiItem {
  id: string;
  name: string;
  category: string;
  defaultCft: number | string;
  defaultWeightKg: number | string;
  baseHandlingRate: number | string;
}

export const catalogApi = {
  async listItems(): Promise<CatalogApiItem[]> {
    return request<CatalogApiItem[]>('/catalog/items');
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
  items?: any[];
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
      itemId?: string;
      customName?: string | null;
      quantity: number;
      packingTier: 'lite' | 'standard' | 'premium';
      customCft?: number;
    }>;
    addons?: string[];
    paymentMethod?: string;
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

  async confirmCod(bookingId: string) {
    return request<BookingItem>(`/bookings/${bookingId}/confirm-cod`, {
      method: 'POST',
    });
  },

  async cancel(bookingId: string) {
    return request<BookingItem>(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },
};

export const customerApi = {
  async getProfile() {
    return request<{
      id: string;
      name: string;
      phone?: string | null;
      email?: string | null;
      whatsappOptIn?: boolean;
      createdAt: string;
      bookingsCount?: number;
    }>('/customer/me');
  },

  async updateProfile(data: { name?: string; phone?: string }) {
    return request<{
      id: string;
      name: string;
      phone?: string | null;
      email?: string | null;
      createdAt: string;
    }>('/customer/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updatePreferences(data: { whatsappOptIn?: boolean; pushToken?: string | null }) {
    return request('/customer/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
