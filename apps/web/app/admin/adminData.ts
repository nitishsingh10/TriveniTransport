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
  floorNumber: number;
  liftAvailable: boolean;
  scheduledDate: string;
  scheduledSlot: string;
  status:
    | 'REQUESTED'
    | 'CONFIRMED'
    | 'ASSIGNED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  baseQuoteAmount: number;
  finalAmount: number;
  advancePaid: number;
  distanceKm: number;
  vendorId?: string;
  vendorName?: string;
  vehicleId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  createdAt: string;
  notes?: string;
  itemsCount: number;
}

export interface AdminVendor {
  id: string;
  name: string;
  phone: string;
  rating: number | null;
  totalTrips: number;
  status: 'active' | 'suspended';
  assignedVehicle?: string;
}

export interface AdminVehicle {
  id: string;
  registrationNumber: string;
  type: string;
  capacityCft: number;
  vendorName: string;
  active: boolean;
  permitExpiry: string;
  fitnessExpiry: string;
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
  getMetrics: () => apiAdmin.getMetrics(),

  async listBookings(filter?: { status?: string; search?: string }) {
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

  async listVendors() {
    const live = await apiAdmin.listVendors();
    return live.map((v: any) => ({
      id: v.id,
      name: v.name,
      phone: v.phone || '—',
      rating: v.rating == null ? null : Number(v.rating),
      totalTrips: Number(v._count?.bookings ?? 0),
      status: v.status,
      assignedVehicle: v.vehicles?.[0]?.registrationNumber,
    }));
  },

  async listVehicles() {
    const live = await apiAdmin.listVehicles();
    return live.map((v: any) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      type: v.type,
      capacityCft: Number(v.capacityCft),
      vendorName: v.vendor?.name || 'Unassigned',
      active: v.active,
      permitExpiry: v.permitExpiry ? new Date(v.permitExpiry).toLocaleDateString('en-IN') : '—',
      fitnessExpiry: v.fitnessCertExpiry ? new Date(v.fitnessCertExpiry).toLocaleDateString('en-IN') : '—',
    }));
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
};
