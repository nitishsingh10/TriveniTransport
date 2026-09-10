// ─────────────────────────────────────────────────────────────────
// Enums (mirror Prisma schema enums exactly)
// ─────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'admin';

export type VendorStatus = 'active' | 'suspended';

export type ZoneType = 'core' | 'extended';

export type PackingTier = 'lite' | 'standard' | 'premium';

export type BookingStatus =
  | 'REQUESTED'
  | 'QUOTED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'REVISION_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type RevisionStatus = 'pending' | 'approved' | 'declined';

export type PaymentStatus = 'created' | 'captured' | 'failed' | 'refunded';

export type PaymentType = 'advance' | 'final' | 'refund';

export type NotificationChannel = 'sms' | 'whatsapp' | 'push' | 'email';

export type NotificationStatus = 'queued' | 'sent' | 'failed';

export type OtpPurpose = 'login';

export type PricingRuleType =
  | 'packing_tier_multiplier'
  | 'labour_threshold'
  | 'surcharge'
  | 'addon';

export type ConfigurationType = '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'villa' | 'office' | 'studio';

// ─────────────────────────────────────────────────────────────────
// Core entity types (API response shapes)
// ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  savedAddresses: SavedAddress[];
  createdAt: string;
}

export interface SavedAddress {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  status: VendorStatus;
  serviceAreas: string[]; // zone IDs
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  vendorId: string;
  type: string;
  capacityCft: number;
  registrationNumber: string;
  permitExpiry: string; // ISO date
  fitnessCertExpiry: string; // ISO date
  active: boolean;
}

export interface LocationZone {
  id: string;
  name: string;
  zoneType: ZoneType;
  pincodes: string[];
  createdAt: string;
}

export interface ZoneRate {
  id: string;
  fromZoneId?: string | null;
  toZoneId?: string | null;
  distanceBand?: string | null;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdBy: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  defaultCft: number;
  defaultWeightKg: number;
  baseHandlingRate: number;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface PricingRule {
  id: string;
  ruleType: PricingRuleType;
  configKey: string;
  value: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface PricingAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  reason?: string | null;
  changedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Booking types
// ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  customerId: string;
  vendorId?: string | null;
  vehicleId?: string | null;
  status: BookingStatus;
  pickupAddress: string;
  dropAddress: string;
  pickupZoneId: string;
  dropZoneId: string;
  distanceKm: number;
  configurationType: ConfigurationType;
  floorNumber: number;
  liftAvailable: boolean;
  scheduledDate: string;
  scheduledSlot: string;
  baseQuoteAmount: number;
  finalAmount: number;
  pricingSnapshot: PricingSnapshot;
  items: BookingItem[];
  revisions: Revision[];
  payments: Payment[];
  statusHistory: BookingStatusHistory[];
  createdAt: string;
}

export interface BookingItem {
  id: string;
  bookingId: string;
  itemId?: string | null;
  customName?: string | null;
  quantity: number;
  packingTier: PackingTier;
  unitPriceApplied: number;
  lineTotal: number;
  isRevision: boolean;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  fromState: BookingStatus | null;
  toState: BookingStatus;
  actorId: string;
  actorRole: UserRole;
  timestamp: string;
}

export interface PricingSnapshot {
  zoneRateId: string;
  zoneRate: number;
  items: Array<{
    itemId: string;
    baseHandlingRate: number;
    packingTierMultiplier: number;
  }>;
  pricingRuleIds: string[];
  computedAt: string;
}

export interface Revision {
  id: string;
  bookingId: string;
  description: string;
  amountDelta: number;
  loggedBy: string;
  status: RevisionStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  amount: number;
  status: PaymentStatus;
  type: PaymentType;
  idempotencyKey: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  bookingId?: string | null;
  recipientId: string;
  recipientRole: UserRole;
  channel: NotificationChannel;
  template: string;
  status: NotificationStatus;
  attempts: number;
  sentAt?: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// API Request / Response types
// ─────────────────────────────────────────────────────────────────

// Auth
export interface OtpRequestBody {
  phone: string;
  role?: UserRole;
}

export interface OtpVerifyBody {
  phone: string;
  otp: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// Quotes
export interface InstantEstimateRequest {
  configurationType: ConfigurationType;
  pickupAddress: string;
  dropAddress: string;
}

export interface InstantEstimateResponse {
  low: number;
  high: number;
  zonePair?: { pickupZoneId: string; dropZoneId: string };
  disclaimer: string;
  distanceKm?: number;
}

export interface ChecklistItem {
  itemId?: string;
  customName?: string;
  quantity: number;
  packingTier: PackingTier;
  customCft?: number; // override for free-text items
}

export interface ItemizedQuoteRequest {
  pickupAddress: string;
  dropAddress: string;
  configurationType: ConfigurationType;
  floorNumber: number;
  liftAvailable: boolean;
  scheduledDate: string;
  scheduledSlot: string;
  items: ChecklistItem[];
  addons: string[]; // PricingRule config_key values
}

export interface QuoteLineItem {
  label: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
  type: 'zone' | 'item' | 'labour' | 'surcharge' | 'addon' | 'second_trip';
}

export interface ItemizedQuoteResponse {
  bookingId: string; // draft booking created
  lines: QuoteLineItem[];
  subtotals: {
    zoneCharge: number;
    goodsSubtotal: number;
    labourCharge: number;
    surcharges: number;
    addons: number;
  };
  totalAmount: number;
  totalCft: number;
  vehicleSuggested?: string;
  requiresSecondTrip: boolean;
}

// Booking actions
export interface HoldBookingResponse {
  held: boolean;
  expiresAt: string; // ISO timestamp
  lockKey: string;
}

export interface CreatePaymentOrderRequest {
  bookingId: string;
  type: PaymentType;
}

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

// Vendor
export interface UpdateJobStatusRequest {
  status: BookingStatus;
}

export interface ManualBookingRequest extends ItemizedQuoteRequest {
  customerPhone: string;
  customerName: string;
}

// Revision
export interface CreateRevisionRequest {
  description: string;
  items: ChecklistItem[];
}

// Admin Reports
export interface MetricsResponse {
  bookingsToday: number;
  bookingsWeek: number;
  bookingsMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  avgBookingValue: number;
  cancellationRate: number;
  disputeRate: number;
  bookingsByStatus: Record<BookingStatus, number>;
  revenueByDay: Array<{ date: string; revenue: number }>;
}

// Paginated list wrapper
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

// Standard error
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// WebSocket events
export type WsClientEvent = 'subscribe_availability' | 'subscribe_booking';

export type WsServerEvent =
  | 'slot_locked'
  | 'slot_released'
  | 'slot_confirmed'
  | 'booking_status_changed'
  | 'revision_logged'
  | 'revision_resolved';

export interface SlotLockedPayload {
  vehicleId: string;
  date: string;
  draftBookingId: string;
}

export interface BookingStatusChangedPayload {
  bookingId: string;
  from: BookingStatus;
  to: BookingStatus;
}

export interface RevisionLoggedPayload {
  bookingId: string;
  revisionId: string;
  amountDelta: number;
  description: string;
}
