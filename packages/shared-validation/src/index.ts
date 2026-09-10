import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Enum schemas
// ─────────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(['customer', 'vendor', 'admin']);

export const PackingTierSchema = z.enum(['lite', 'standard', 'premium']);

export const ConfigurationTypeSchema = z.enum([
  '1bhk', '2bhk', '3bhk', '4bhk', 'villa', 'office', 'studio',
]);

export const BookingStatusSchema = z.enum([
  'REQUESTED',
  'QUOTED',
  'CONFIRMED',
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'REVISION_PENDING',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
]);

export const PaymentTypeSchema = z.enum(['advance', 'final', 'refund']);

export const PricingRuleTypeSchema = z.enum([
  'packing_tier_multiplier',
  'labour_threshold',
  'surcharge',
  'addon',
]);

// ─────────────────────────────────────────────────────────────────
// Auth schemas
// ─────────────────────────────────────────────────────────────────

export const PhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const OtpRequestSchema = z.object({
  phone: PhoneSchema,
  role: UserRoleSchema.optional().default('customer'),
});

export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  role: UserRoleSchema,
});

// ─────────────────────────────────────────────────────────────────
// Quote schemas
// ─────────────────────────────────────────────────────────────────

export const InstantEstimateSchema = z.object({
  configurationType: ConfigurationTypeSchema,
  pickupAddress: z.string().min(5, 'Pickup address too short').max(500),
  dropAddress: z.string().min(5, 'Drop address too short').max(500),
});

export const ChecklistItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  customName: z.string().max(100).optional(),
  quantity: z.number().int().positive().max(100),
  packingTier: PackingTierSchema,
  customCft: z.number().positive().optional(),
}).refine(
  (d) => d.itemId || d.customName,
  { message: 'Either itemId or customName must be provided' }
);

export const ItemizedQuoteSchema = z.object({
  pickupAddress: z.string().min(5).max(500),
  dropAddress: z.string().min(5).max(500),
  configurationType: ConfigurationTypeSchema,
  floorNumber: z.number().int().min(0).max(50),
  liftAvailable: z.boolean(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  scheduledSlot: z.string().min(1),
  items: z.array(ChecklistItemSchema).min(1, 'At least one item required'),
  addons: z.array(z.string()).default([]),
});

// ─────────────────────────────────────────────────────────────────
// Booking schemas
// ─────────────────────────────────────────────────────────────────

export const UpdateJobStatusSchema = z.object({
  status: BookingStatusSchema,
});

export const ManualBookingSchema = ItemizedQuoteSchema.extend({
  customerPhone: PhoneSchema,
  customerName: z.string().min(2).max(100),
});

// ─────────────────────────────────────────────────────────────────
// Revision schemas
// ─────────────────────────────────────────────────────────────────

export const CreateRevisionSchema = z.object({
  description: z.string().min(5).max(500),
  items: z.array(ChecklistItemSchema).min(1),
});

// ─────────────────────────────────────────────────────────────────
// Payment schemas
// ─────────────────────────────────────────────────────────────────

export const CreatePaymentOrderSchema = z.object({
  bookingId: z.string().uuid(),
  type: PaymentTypeSchema,
});

// ─────────────────────────────────────────────────────────────────
// Admin schemas
// ─────────────────────────────────────────────────────────────────

export const CreateZoneSchema = z.object({
  name: z.string().min(2).max(100),
  zoneType: z.enum(['core', 'extended']),
  pincodes: z.array(z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits')).min(1),
});

export const CreateZoneRateSchema = z.object({
  fromZoneId: z.string().uuid().optional(),
  toZoneId: z.string().uuid().optional(),
  distanceBand: z.string().optional(),
  rate: z.number().positive(),
  effectiveFrom: z.string().datetime(),
  reason: z.string().min(5).max(500).optional(),
}).refine(
  (d) => (d.fromZoneId && d.toZoneId) || d.distanceBand,
  { message: 'Either (fromZoneId + toZoneId) or distanceBand must be provided' }
);

export const CreateItemSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  defaultCft: z.number().positive(),
  defaultWeightKg: z.number().positive(),
  baseHandlingRate: z.number().positive(),
  effectiveFrom: z.string().datetime(),
  reason: z.string().min(5).max(500).optional(),
});

export const CreatePricingRuleSchema = z.object({
  ruleType: PricingRuleTypeSchema,
  configKey: z.string().min(2).max(100),
  value: z.number(),
  effectiveFrom: z.string().datetime(),
  reason: z.string().min(5).max(500).optional(),
});

// ─────────────────────────────────────────────────────────────────
// Query/filter schemas
// ─────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const BookingFilterSchema = PaginationSchema.extend({
  status: BookingStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  search: z.string().optional(), // customer name/phone
});

// ─────────────────────────────────────────────────────────────────
// Customer preferences
// ─────────────────────────────────────────────────────────────────

export const UpdatePreferencesSchema = z.object({
  whatsappOptIn: z.boolean().optional(),
  pushOptIn: z.boolean().optional(),
  emailOptIn: z.boolean().optional(),
});

// Inferred types
export type OtpRequestInput = z.infer<typeof OtpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
export type InstantEstimateInput = z.infer<typeof InstantEstimateSchema>;
export type ItemizedQuoteInput = z.infer<typeof ItemizedQuoteSchema>;
export type ChecklistItemInput = z.infer<typeof ChecklistItemSchema>;
export type CreateRevisionInput = z.infer<typeof CreateRevisionSchema>;
export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;
export type ManualBookingInput = z.infer<typeof ManualBookingSchema>;
export type CreateZoneInput = z.infer<typeof CreateZoneSchema>;
export type CreateZoneRateInput = z.infer<typeof CreateZoneRateSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type CreatePricingRuleInput = z.infer<typeof CreatePricingRuleSchema>;
export type BookingFilterInput = z.infer<typeof BookingFilterSchema>;
