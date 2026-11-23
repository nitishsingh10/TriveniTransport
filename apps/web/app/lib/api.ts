/**
 * Triveni Transports — API Client
 * Central HTTP client that attaches JWT, handles 401 refresh, and
 * provides typed helpers for every backend module.
 */

const getBaseUrl = (): string => {
  let url = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

const BASE = getBaseUrl();
let refreshInFlight: Promise<boolean> | null = null;

// ── Token helpers (localStorage, client-side only) ──────────────────
export const token = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_access') : null,
  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_refresh') : null,
  set: (access: string, refresh: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tt_access', access);
      localStorage.setItem('tt_refresh', refresh);
      window.dispatchEvent(new Event('tt_auth_change'));
    }
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tt_access');
      localStorage.removeItem('tt_refresh');
      localStorage.removeItem('tt_role');
      localStorage.removeItem('tt_user');
      window.dispatchEvent(new Event('tt_auth_change'));
    }
  },
  setRole: (role: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tt_role', role);
      window.dispatchEvent(new Event('tt_auth_change'));
    }
  },
  getRole: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tt_role') : null,
  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tt_user', JSON.stringify(user));
      window.dispatchEvent(new Event('tt_auth_change'));
    }
  },
  getUser: (): any | null => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem('tt_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
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
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, options, false); // retry once
    }

    // Refresh failed — clear session and redirect to login
    const role = token.getRole();
    token.clear();
    if (typeof window !== 'undefined') {
      const loginPath = role === 'vendor' ? '/vendor/login' : role === 'supervisor' ? '/vendor/supervisor/login' : role === 'admin' ? '/admin/login' : '/login';
      window.location.href = loginPath;
    }
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

/** Refresh once for concurrent expired requests and store the rotated refresh token. */
function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const currentRefreshToken = token.getRefresh();
  if (!currentRefreshToken) return Promise.resolve(false);

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (!response.ok) return false;

      const refreshed = await response.json().catch(() => null);
      if (
        typeof refreshed?.accessToken !== 'string' ||
        typeof refreshed?.refreshToken !== 'string'
      ) return false;

      token.set(refreshed.accessToken, refreshed.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
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

export const auth = {
  requestOtp: (
    identifier: string,
    role: 'customer' | 'vendor' | 'supervisor' | 'admin' = 'customer',
    isSignup = false,
    serviceType?: 'packers_movers' | 'transport'
  ) => {
    const isEmail = identifier.includes('@');
    return apiFetch<{ message: string; channel?: 'email' | 'sms'; destination?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        ...(isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() }),
        role,
        serviceType,
        isSignup,
      }),
    });
  },

  verifyOtp: (
    identifier: string,
    code: string,
    role: 'customer' | 'vendor' | 'supervisor' | 'admin' = 'customer',
    name?: string,
    isSignup = false,
    serviceType?: 'packers_movers' | 'transport'
  ) => {
    const isEmail = identifier.includes('@');
    return apiFetch<{
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
        role,
        serviceType,
        name,
        isSignup,
      }),
    });
  },

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token.getRefresh() }),
    }).finally(() => token.clear()),
};

export interface VendorProfile {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status?: string;
  serviceType?: 'packers_movers' | 'transport' | null;
  onboardingStatus?: string;
  onboardingData?: Record<string, unknown>;
  reviewNotes?: string | null;
  _count?: { bookings: number };
  documents?: Array<{ documentType: string; fileName: string; status: string; uploadedAt: string }>;
}

export interface PartnerContract {
  version: string;
  hash: string;
  text: string;
  signature: null | {
    signerName: string;
    signerRole: string;
    signatureText: string;
    signedAt: string;
    contractHash: string;
  };
}

export interface VendorVehicle {
  id: string;
  type: string;
  capacityCft: number;
  registrationNumber: string;
  permitExpiry?: string;
  fitnessCertExpiry?: string;
  active: boolean;
}

export interface VendorJob {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledSlot: string;
  pickupAddress: string;
  dropAddress: string;
  customer?: { name: string; phone: string } | null;
  vehicle?: { type: string; registrationNumber: string } | null;
  serviceType?: 'packers_movers' | 'transport';
  supervisorId?: string | null;
  supervisor?: { id: string; name: string; phone: string } | null;
}

export interface VendorSupervisor {
  id: string;
  name: string;
  phone: string;
  status: 'invited' | 'active' | 'suspended';
  phoneVerifiedAt?: string | null;
}

async function uploadVendorDocument(file: File, documentType: string) {
  const signed = await apiFetch<{ uploadUrl: string; objectKey: string; maxBytes: number }>('/vendor/documents/presign', {
    method: 'POST',
    body: JSON.stringify({ documentType, fileName: file.name, mimeType: file.type, size: file.size }),
  });
  if (file.size > signed.maxBytes) throw new Error('Each document must be 10 MB or smaller.');
  const uploaded = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!uploaded.ok) throw new Error('Secure document upload failed. Please try again.');
  return apiFetch('/vendor/documents/complete', {
    method: 'POST',
    body: JSON.stringify({ documentType, fileName: file.name, mimeType: file.type, objectKey: signed.objectKey }),
  });
}

export const vendor = {
  getProfile: () => apiFetch<VendorProfile>('/vendor/profile'),
  getVehicles: () => apiFetch<VendorVehicle[]>('/vendor/vehicles'),
  getJobs: () => apiFetch<VendorJob[]>('/vendor/jobs'),
  submitOnboarding: (body: Record<string, unknown>) => apiFetch<{ onboardingStatus: string }>('/vendor/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  getPartnerContract: () => apiFetch<PartnerContract>('/vendor/partner-contract'),
  requestPartnerContractOtp: () => apiFetch<{ message: string; channel: 'phone' | 'email'; destination: string }>('/vendor/partner-contract/otp', { method: 'POST' }),
  signPartnerContract: (body: { version: string; hash: string; signerName: string; signerRole: string; signatureText: string; otp: string; acceptTerms: true }) =>
    apiFetch<{ signed: boolean }>('/vendor/partner-contract/sign', { method: 'POST', body: JSON.stringify(body) }),
  getSupervisors: () => apiFetch<VendorSupervisor[]>('/vendor/supervisors'),
  getSupervisorJobs: () => apiFetch<VendorJob[]>('/vendor/supervisor/jobs'),
  updateSupervisorJobStatus: (bookingId: string, status: string) => apiFetch(`/vendor/supervisor/jobs/${bookingId}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  }),
  addSupervisor: (body: { name: string; phone: string }) => apiFetch<VendorSupervisor>('/vendor/supervisors', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  revokeSupervisor: (supervisorId: string) => apiFetch<VendorSupervisor>(`/vendor/supervisors/${supervisorId}/revoke`, {
    method: 'PATCH',
  }),
  uploadDocument: uploadVendorDocument,
  assignSupervisor: (bookingId: string, supervisorId: string | null) => apiFetch(`/vendor/bookings/${bookingId}/supervisor`, {
    method: 'POST',
    body: JSON.stringify({ supervisorId }),
  }),
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

export interface TransportVehicleConfig {
  type: 'tata_ace' | 'tata_407' | 'eicher_17ft';
  displayName: string;
  capacityCft: number;
  payloadKg: number;
  dimensions: string;
  baseRate: number;
  baseKm: number;
  perKmRate: number;
  helperRate: number;
  description: string;
  recommendedFor: string;
  estimatedCost?: number;
}

export interface TransportQuoteResponse {
  serviceType: 'transport';
  quoteAmount: number;
  breakdown: {
    baseTripCharge: number;
    distanceCharge: number;
    helperCharge: number;
    tollOrSurcharges: number;
  };
  metrics: {
    vehicleType: 'tata_ace' | 'tata_407' | 'eicher_17ft';
    vehicleName: string;
    distanceKm: number;
    durationMins: number;
    helperCount: number;
    capacityCft: number;
    payloadKg: number;
  };
  snapshot: any;
}

export interface TransportQuoteInput {
  pickupAddress: string;
  dropAddress: string;
  vehicleType: 'tata_ace' | 'tata_407' | 'eicher_17ft';
  scheduledDate: string;
  scheduledSlot: string;
  helperCount?: number;
  alternateContactPhone?: string;
  goodsType?: string;
  paymentMethod?: 'cash_on_delivery' | 'online';
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

  getTransportVehicles: (distanceKm?: number) => {
    const query = distanceKm ? `?distanceKm=${encodeURIComponent(distanceKm)}` : '';
    return apiFetch<TransportVehicleConfig[]>(`/quotes/transport-vehicles${query}`);
  },

  transport: (body: TransportQuoteInput) =>
    apiFetch<TransportQuoteResponse>('/quotes/transport', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  itemized: (body: {
    pickupAddress: string;
    dropAddress: string;
    alternateContactPhone?: string;
    configurationType: string;
    floorNumber: number;
    liftAvailable: boolean;
    parkingClose?: boolean;
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
  customerId?: string;
  distanceKm?: number;
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
    alternateContactPhone?: string;
    configurationType: string;
    floorNumber: number;
    liftAvailable: boolean;
    parkingClose?: boolean;
    scheduledDate: string;
    scheduledSlot: string;
    items: unknown[];
    addons: string[];
    paymentMethod?: 'cash_on_delivery' | 'online';
  }) =>
    apiFetch<{ booking: Booking; quote: ItemizedQuoteResponse }>('/bookings', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'cash_on_delivery', ...body }),
    }),

  createTransport: (body: TransportQuoteInput) =>
    apiFetch<{ booking: Booking; quote: TransportQuoteResponse }>('/bookings/transport', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: 'cash_on_delivery', ...body }),
    }),

  list: () => apiFetch<Booking[]>('/bookings'),

  get: (id: string) => apiFetch<Booking>(`/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    apiFetch<Booking>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  deleteDraft: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/bookings/${id}`, {
      method: 'DELETE',
    }),

  confirmCod: (id: string) =>
    apiFetch<Booking>(`/bookings/${id}/confirm-cod`, { method: 'POST' }),

  holdSlot: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/bookings/${id}/hold`, {
      method: 'POST',
    }),
};

// ── Payments ─────────────────────────────────────────────────────────
export const payments = {
  createOrder: (bookingId: string, type: 'advance' | 'final') =>
    apiFetch<{ id: string; amount: number; currency: string }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId, type }),
    }),
};

// ── Admin ────────────────────────────────────────────────────────────
export interface AdminMetrics {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalCustomers: number;
  totalVendors: number;
  totalVehicles: number;
  totalRevenue: number;
  activeRevenue: number;
}

export interface AdminBookingListResponse {
  bookings: Array<Booking & {
    customer?: { id: string; name: string; phone: string; email?: string | null };
    vendor?: { id: string; name: string; phone: string } | null;
    vehicle?: { id: string; type: string; registrationNumber: string } | null;
    _count?: { items: number; revisions: number };
    supervisor?: { id: string; name: string; phone: string } | null;
  }>;
  total: number;
  skip: number;
  take: number;
}

export const admin = {
  getMetrics: (serviceType?: 'packers_movers' | 'transport') => apiFetch<AdminMetrics>(`/admin/metrics${serviceType ? `?serviceType=${serviceType}` : ''}`),
  listBookings: (params?: { status?: string; search?: string; skip?: number; take?: number; serviceType?: 'packers_movers' | 'transport' }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    if (params?.serviceType) q.append('serviceType', params.serviceType);
    if (params?.skip !== undefined) q.append('skip', String(params.skip));
    if (params?.take !== undefined) q.append('take', String(params.take));
    const qs = q.toString();
    return apiFetch<AdminBookingListResponse>(`/admin/bookings${qs ? `?${qs}` : ''}`);
  },
  getBooking: (id: string) => apiFetch<any>(`/admin/bookings/${id}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiFetch<any>(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  assign: (id: string, vendorId: string, vehicleId?: string) =>
    apiFetch<any>(`/admin/bookings/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ vendorId, vehicleId }),
    }),
  listVendors: (serviceType?: 'packers_movers' | 'transport') => apiFetch<any[]>(`/admin/vendors${serviceType ? `?serviceType=${serviceType}` : ''}`),
  listVehicles: (serviceType?: 'packers_movers' | 'transport') => apiFetch<any[]>(`/admin/vehicles${serviceType ? `?serviceType=${serviceType}` : ''}`),
  reviewVendor: (id: string, status: 'under_review' | 'needs_changes' | 'approved' | 'rejected', notes?: string) => apiFetch<any>(`/admin/vendors/${id}/review`, {
    method: 'PATCH', body: JSON.stringify({ status, notes }),
  }),
  getVendorDocuments: (id: string) => apiFetch<any[]>(`/admin/vendors/${id}/documents`),
  getVendorContract: (id: string) => apiFetch<{
    currentVersion: string;
    currentHash: string;
    signature: {
      contractVersion: string;
      contractHash: string;
      signerName: string;
      signerRole: string;
      signedAt: string;
      otpChallengeId: string;
      ipAddress: string | null;
      userAgent: string | null;
      contractText: string;
    } | null;
  }>(`/admin/vendors/${id}/contract`),
  reviewVendorDocument: (id: string, status: 'approved' | 'rejected', notes?: string) => apiFetch<any>(`/admin/vendor-documents/${id}/review`, {
    method: 'PATCH', body: JSON.stringify({ status, notes }),
  }),
  listItems: () => apiFetch<any[]>('/admin/items'),
  listPricingRules: () => apiFetch<any[]>('/admin/pricing-rules'),
  listZones: () => apiFetch<any[]>('/admin/zones'),
  listAuditLogs: () => apiFetch<any[]>('/admin/audit-logs'),
  getNotifications: () => apiFetch<any[]>('/admin/notifications'),
  retryNotification: (id: string) =>
    apiFetch<any>(`/admin/notifications/${id}/retry`, { method: 'POST' }),
};

