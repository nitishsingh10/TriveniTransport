/**
 * Triveni Transports — API Client
 * Central HTTP client that attaches JWT, handles 401 refresh, and
 * provides typed helpers for every backend module.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ── Token helpers (localStorage, client-side only) ──────────────────
export const token = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_access') : null,
  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_refresh') : null,
  set: (access: string, refresh: string) => {
    localStorage.setItem('tt_access', access);
    localStorage.setItem('tt_refresh', refresh);
  },
  clear: () => {
    localStorage.removeItem('tt_access');
    localStorage.removeItem('tt_refresh');
    localStorage.removeItem('tt_role');
  },
  setRole: (role: string) => localStorage.setItem('tt_role', role),
  getRole: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_role') : null,
  isLoggedIn: (): boolean =>
    typeof window !== 'undefined' && !!localStorage.getItem('tt_access'),
};

// ── Core fetch wrapper ───────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const accessToken = token.getAccess();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Attempt transparent token refresh on 401
  if (res.status === 401 && retry) {
    const refreshToken = token.getRefresh();
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const { accessToken: newAccess } = await refreshRes.json();
        localStorage.setItem('tt_access', newAccess);
        return apiFetch<T>(path, options, false); // retry once
      }
    }
    // Refresh failed — clear session and redirect to login
    token.clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new ApiError(res.status, err?.error?.code ?? 'ERROR', err?.error?.message ?? res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ─────────────────────────────────────────────────────────────
export const auth = {
  requestOtp: (phone: string, role: 'customer' | 'vendor' | 'admin' = 'customer') =>
    apiFetch<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    }),

  verifyOtp: (phone: string, code: string, role: 'customer' | 'vendor' | 'admin' = 'customer') =>
    apiFetch<{ accessToken: string; refreshToken: string; userId: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, role }),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token.getRefresh() }),
    }).finally(() => token.clear()),
};

// ── Quotes ───────────────────────────────────────────────────────────
export interface InstantEstimate {
  minEstimate: number;
  maxEstimate: number;
  currency: string;
  disclaimer: string;
}

export interface ItemizedQuoteResponse {
  quoteAmount: number;
  breakdown: {
    goodsSubtotal: number;
    zoneCharge: number;
    labourCharge: number;
    surcharges: number;
    addonsTotal: number;
  };
  metrics: { totalCft: number; totalWeightKg: number };
  snapshot: Record<string, unknown>;
}

export const quotes = {
  instantEstimate: (body: {
    pickupAddress: string;
    dropAddress: string;
    configurationType: string;
  }) =>
    apiFetch<InstantEstimate>('/quotes/instant-estimate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  itemized: (body: {
    pickupAddress: string;
    dropAddress: string;
    configurationType: string;
    floorNumber: number;
    liftAvailable: boolean;
    scheduledDate: string;
    scheduledSlot: string;
    items: Array<{
      itemId?: string | null;
      customName?: string | null;
      quantity: number;
      packingTier: 'lite' | 'standard' | 'premium';
      customCft?: number;
    }>;
    addons: string[];
  }) =>
    apiFetch<ItemizedQuoteResponse>('/quotes/itemized', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ── Bookings ─────────────────────────────────────────────────────────
export interface Booking {
  id: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  scheduledDate: string;
  scheduledSlot: string;
  configurationType: string;
  floorNumber: number;
  liftAvailable: boolean;
  finalAmount: number;
  baseQuoteAmount: number;
  createdAt: string;
  vendor?: { id: string; name: string; phone: string } | null;
  vehicle?: { id: string; type: string; registrationNumber: string } | null;
  items?: Array<{
    id: string;
    customName: string | null;
    quantity: number;
    packingTier: string;
    lineTotal: number;
    unitPriceApplied: number;
  }>;
  statusHistory?: Array<{
    id: string;
    fromState: string | null;
    toState: string;
    timestamp: string;
    actorRole: string;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    type: string;
    createdAt: string;
  }>;
}

export const bookings = {
  create: (body: {
    pickupAddress: string;
    dropAddress: string;
    configurationType: string;
    floorNumber: number;
    liftAvailable: boolean;
    scheduledDate: string;
    scheduledSlot: string;
    items: unknown[];
    addons: string[];
  }) =>
    apiFetch<{ booking: Booking; quote: ItemizedQuoteResponse }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  list: () => apiFetch<Booking[]>('/bookings'),

  get: (id: string) => apiFetch<Booking>(`/bookings/${id}`),

  cancel: (id: string) =>
    apiFetch<Booking>(`/bookings/${id}/cancel`, { method: 'POST' }),

  holdSlot: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/bookings/${id}/hold`, {
      method: 'POST',
    }),
};

// ── Payments ─────────────────────────────────────────────────────────
export const payments = {
  createOrder: (bookingId: string, type: 'advance' | 'final') =>
    apiFetch<{ id: string; amount: number; currency: string }>('/payments/order', {
      method: 'POST',
      body: JSON.stringify({ bookingId, type }),
    }),
};
