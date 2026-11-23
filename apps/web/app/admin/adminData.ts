/**
 * Triveni Transports — Admin Data Service
 * Reads and updates authoritative admin data through the backend API.
 */

import { admin as apiAdmin } from '../lib/api';

export interface AdminBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupAddress: string;
  dropAddress: string;
  configurationType: string;
  totalCft: number;
  serviceType: 'packers_movers' | 'transport';
  floorNumber: number;
  liftAvailable: boolean;
  scheduledDate: string;
  scheduledSlot: string;
  status:
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
  baseQuoteAmount: number;
  finalAmount: number;
  advancePaid: number;
  distanceKm: number;
  vendorId?: string;
  vendorName?: string;
  vehicleId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  supervisorId?: string;
  supervisorName?: string;
  createdAt: string;
  notes?: string;
  itemsCount: number;
}

export interface AdminVendor {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  rating: number | null;
  totalTrips: number;
  status: 'pending' | 'active' | 'suspended';
  serviceType?: 'packers_movers' | 'transport' | null;
  onboardingStatus: string;
  driverLicenseExpiry?: string | null;
  onboardingData?: Record<string, any>;
  reviewNotes?: string | null;
  documents?: Array<{ id: string; documentType: string; fileName: string; mimeType: string; status: string; reviewNotes?: string | null; uploadedAt: string }>;
  contractSignatures?: Array<{ contractVersion: string; contractHash: string; signerName: string; signerRole: string; signedAt: string }>;
  assignedVehicle?: string;
}

export interface AdminVehicle {
  id: string;
  vendorId: string;
  registrationNumber: string;
  type: string;
  capacityCft: number;
  vendorName: string;
  active: boolean;
  verificationStatus?: string;
  permitExpiry: string;
  fitnessExpiry: string;
  insuranceExpiry: string;
}

export interface AdminPricingItem {
  id: string;
  name: string;
  category: string;
  defaultCft: number;
  defaultWeightKg: number;
  baseHandlingRate: number;
  active: boolean;
}

export interface AdminPricingRule {
  id: string;
  ruleType: string;
  configKey: string;
  value: number;
  description: string;
}

export interface AdminAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  adminName: string;
  reason?: string;
  changedAt: string;
}

export interface AdminNotification {
  id: string;
  template: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | 'push' | 'email';
  status: 'sent' | 'queued' | 'failed';
  bookingId?: string;
  createdAt: string;
}

// ── Exported Service API ───────────────────────────────────────────────
export const AdminDataService = {
  getMetrics: (serviceType?: 'packers_movers' | 'transport') => apiAdmin.getMetrics(serviceType),

  async listBookings(filter?: { status?: string; search?: string; serviceType?: 'packers_movers' | 'transport' }) {
    const live = await apiAdmin.listBookings(filter);
    return live.bookings.map((b: any) => ({
      // Keep the real database ID for all follow-up admin operations.
      id: b.id,
      customerId: b.customerId,
      customerName: b.customer?.name || '—',
      customerPhone: b.customer?.phone || '—',
      customerEmail: b.customer?.email || undefined,
      pickupAddress: b.pickupAddress,
      dropAddress: b.dropAddress,
      configurationType: b.configurationType || '—',
      totalCft: Number((b.pricingSnapshot as any)?.totalCft ?? 0),
      serviceType: b.serviceType || 'packers_movers',
      floorNumber: b.floorNumber ?? 0,
      liftAvailable: b.liftAvailable,
      scheduledDate: b.scheduledDate ? new Date(b.scheduledDate).toISOString().slice(0, 10) : '—',
      scheduledSlot: b.scheduledSlot || '—',
      status: b.status as AdminBooking['status'],
      baseQuoteAmount: Number(b.baseQuoteAmount ?? 0),
      finalAmount: Number(b.finalAmount ?? 0),
      advancePaid: Array.isArray(b.payments)
        ? b.payments.filter((p: any) => p.status === 'paid' || p.status === 'SUCCEEDED').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
        : 0,
      distanceKm: Number(b.distanceKm ?? 0),
      vendorId: b.vendor?.id,
      vendorName: b.vendor?.name,
      vehicleId: b.vehicle?.id,
      vehicleType: b.vehicle?.type,
      vehicleNumber: b.vehicle?.registrationNumber,
      supervisorId: b.supervisor?.id,
      supervisorName: b.supervisor?.name,
      createdAt: b.createdAt,
      itemsCount: b._count?.items ?? 0,
    }));
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: AdminBooking['status'],
    notes?: string
  ) {
    return apiAdmin.updateStatus(bookingId, newStatus, notes);
  },

  assignBooking(bookingId: string, vendorId: string, vehicleId?: string) {
    return apiAdmin.assign(bookingId, vendorId, vehicleId);
  },

  async listVendors(serviceType?: 'packers_movers' | 'transport') {
    const live = await apiAdmin.listVendors(serviceType);
    return live.map((v: any) => ({
      id: v.id,
      name: v.name,
      phone: v.phone || '—',
      rating: v.rating == null ? null : Number(v.rating),
      totalTrips: Number(v._count?.bookings ?? 0),
      status: v.status,
      serviceType: v.serviceType,
      onboardingStatus: v.onboardingStatus,
      driverLicenseExpiry: v.driverLicenseExpiry ? new Date(v.driverLicenseExpiry).toISOString().slice(0, 10) : null,
      onboardingData: v.onboardingData,
      reviewNotes: v.reviewNotes,
      documents: v.documents || [],
      contractSignatures: v.contractSignatures || [],
      assignedVehicle: v.vehicles?.[0]?.registrationNumber,
    }));
  },

  async listVehicles(serviceType?: 'packers_movers' | 'transport') {
    const live = await apiAdmin.listVehicles(serviceType);
    return live.map((v: any) => ({
      id: v.id,
      vendorId: v.vendor?.id || '',
      registrationNumber: v.registrationNumber,
      type: v.type,
      capacityCft: Number(v.capacityCft),
      vendorName: v.vendor?.name || 'Unassigned',
      active: v.active,
      verificationStatus: v.verificationStatus,
      permitExpiry: v.permitExpiry ? new Date(v.permitExpiry).toISOString().slice(0, 10) : '',
      fitnessExpiry: v.fitnessCertExpiry ? new Date(v.fitnessCertExpiry).toISOString().slice(0, 10) : '',
      insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().slice(0, 10) : '',
    }));
  },

  getVendorContract(vendorId: string) {
    return apiAdmin.getVendorContract(vendorId);
  },

  async listPricingItems() {
    const live = await apiAdmin.listItems();
    return live.map((item: any) => ({ ...item, defaultCft: Number(item.defaultCft), defaultWeightKg: Number(item.defaultWeightKg), baseHandlingRate: Number(item.baseHandlingRate) }));
  },

  async listPricingRules() {
    const live = await apiAdmin.listPricingRules();
    return live.map((rule: any) => ({ ...rule, value: Number(rule.value) }));
  },

  async listAuditLogs() {
    const live = await apiAdmin.listAuditLogs();
    return live.map((log: any) => ({
      ...log,
      adminName: log.admin?.name || 'Administrator',
      changedAt: log.changedAt,
    }));
  },

  async listNotifications() {
    return apiAdmin.getNotifications();
  },

  retryNotification: (notifId: string) => apiAdmin.retryNotification(notifId),
  reviewVendor: (id: string, status: 'under_review' | 'needs_changes' | 'approved' | 'rejected', notes?: string) => apiAdmin.reviewVendor(id, status, notes),
  getVendorDocuments: (id: string) => apiAdmin.getVendorDocuments(id),
  reviewVendorDocument: (id: string, status: 'approved' | 'rejected', notes?: string) => apiAdmin.reviewVendorDocument(id, status, notes),
};
