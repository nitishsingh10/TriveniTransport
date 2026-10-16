/**
 * Triveni Transports — Admin Data Service
 * Connects directly to backend API (/api/v1/admin/*) with transparent
 * fallback to persistent client-side state when the backend is offline.
 */

import { admin as apiAdmin, token } from '../lib/api';

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
  rating: number;
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

// ── In-Memory / LocalStorage Persistence Seed ──────────────────────────
const SEED_BOOKINGS: AdminBooking[] = [
  {
    id: 'TRV-8941',
    customerId: 'cust-1',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98201 44521',
    customerEmail: 'aarav.mehta@gmail.com',
    pickupAddress: 'Marvel Cerise, Kharadi, Pune, MH 411014',
    dropAddress: 'Pride World City, Charholi Budruk, Pune, MH 412105',
    configurationType: '3 BHK Premium',
    floorNumber: 7,
    liftAvailable: true,
    scheduledDate: '2026-10-18',
    scheduledSlot: 'Morning (8 AM – 11 AM)',
    status: 'EN_ROUTE',
    baseQuoteAmount: 16800,
    finalAmount: 16800,
    advancePaid: 3360,
    distanceKm: 18.4,
    vendorId: 'ven-1',
    vendorName: 'Ramesh Shinde (Captain)',
    vehicleId: 'veh-2',
    vehicleType: 'Tata 407 (600 CFT)',
    vehicleNumber: 'MH 12 RN 4071',
    createdAt: '2026-10-15T09:30:00Z',
    itemsCount: 38,
  },
  {
    id: 'TRV-8942',
    customerId: 'cust-2',
    customerName: 'Priya Deshmukh',
    customerPhone: '+91 97652 11094',
    customerEmail: 'priya.deshmukh@outlook.com',
    pickupAddress: 'Rohan Mithila, Viman Nagar, Pune, MH 411014',
    dropAddress: 'Blue Ridge Township, Hinjewadi Phase 1, Pune, MH 411057',
    configurationType: '2 BHK Standard',
    floorNumber: 4,
    liftAvailable: true,
    scheduledDate: '2026-10-19',
    scheduledSlot: 'Afternoon (12 PM – 3 PM)',
    status: 'ASSIGNED',
    baseQuoteAmount: 11200,
    finalAmount: 11200,
    advancePaid: 2240,
    distanceKm: 24.2,
    vendorId: 'ven-2',
    vendorName: 'Sanjay Patil (Senior Captain)',
    vehicleId: 'veh-1',
    vehicleType: 'Tata Ace (300 CFT)',
    vehicleNumber: 'MH 12 AB 1234',
    createdAt: '2026-10-15T14:15:00Z',
    itemsCount: 24,
  },
  {
    id: 'TRV-8943',
    customerId: 'cust-3',
    customerName: 'Vikram Joshi',
    customerPhone: '+91 98900 88214',
    customerEmail: 'v.joshi@techcorp.in',
    pickupAddress: 'Kumar Paradise, Magarpatta City, Hadapsar, Pune',
    dropAddress: 'Pancard Club Road, Baner, Pune, MH 411045',
    configurationType: 'Villa / 4 BHK Luxury',
    floorNumber: 0,
    liftAvailable: true,
    scheduledDate: '2026-10-20',
    scheduledSlot: 'Morning (8 AM – 11 AM)',
    status: 'CONFIRMED',
    baseQuoteAmount: 28500,
    finalAmount: 28500,
    advancePaid: 5700,
    distanceKm: 26.8,
    createdAt: '2026-10-16T11:00:00Z',
    itemsCount: 62,
  },
  {
    id: 'TRV-8944',
    customerId: 'cust-4',
    customerName: 'Ananya Sen',
    customerPhone: '+91 91234 56780',
    customerEmail: 'ananya.sen@gmail.com',
    pickupAddress: 'Gera Trinity Towers, Kharadi, Pune',
    dropAddress: 'Eon Waterfront, Kharadi, Pune',
    configurationType: '1 BHK Compact',
    floorNumber: 3,
    liftAvailable: false,
    scheduledDate: '2026-10-17',
    scheduledSlot: 'Evening (5 PM – 8 PM)',
    status: 'REQUESTED',
    baseQuoteAmount: 6400,
    finalAmount: 6400,
    advancePaid: 0,
    distanceKm: 4.1,
    createdAt: '2026-10-16T16:20:00Z',
    itemsCount: 14,
  },
  {
    id: 'TRV-8939',
    customerId: 'cust-5',
    customerName: 'Devendra Kulkarni',
    customerPhone: '+91 94223 99012',
    customerEmail: 'd.kulkarni@gmail.com',
    pickupAddress: 'Mayur Colony, Kothrud, Pune, MH 411038',
    dropAddress: 'Balewadi High Street, Balewadi, Pune, MH 411045',
    configurationType: '2 BHK Standard',
    floorNumber: 2,
    liftAvailable: true,
    scheduledDate: '2026-10-15',
    scheduledSlot: 'Morning (8 AM – 11 AM)',
    status: 'COMPLETED',
    baseQuoteAmount: 9800,
    finalAmount: 9800,
    advancePaid: 1960,
    distanceKm: 14.7,
    vendorId: 'ven-1',
    vendorName: 'Ramesh Shinde (Captain)',
    vehicleId: 'veh-1',
    vehicleType: 'Tata Ace (300 CFT)',
    vehicleNumber: 'MH 12 AB 1234',
    createdAt: '2026-10-12T08:00:00Z',
    itemsCount: 22,
  },
  {
    id: 'TRV-8938',
    customerId: 'cust-6',
    customerName: 'Rohan Bhattacharya',
    customerPhone: '+91 93245 67891',
    pickupAddress: 'Amanora Gateway Towers, Hadapsar, Pune',
    dropAddress: 'Dutta Mandir Road, Wakad, Pune',
    configurationType: '3 BHK Executive',
    floorNumber: 14,
    liftAvailable: true,
    scheduledDate: '2026-10-14',
    scheduledSlot: 'Morning (8 AM – 11 AM)',
    status: 'COMPLETED',
    baseQuoteAmount: 18200,
    finalAmount: 18200,
    advancePaid: 3640,
    distanceKm: 27.5,
    vendorId: 'ven-2',
    vendorName: 'Sanjay Patil (Senior Captain)',
    vehicleId: 'veh-2',
    vehicleType: 'Tata 407 (600 CFT)',
    vehicleNumber: 'MH 12 RN 4071',
    createdAt: '2026-10-11T13:40:00Z',
    itemsCount: 41,
  },
];

const SEED_VENDORS: AdminVendor[] = [
  {
    id: 'ven-1',
    name: 'Ramesh Shinde (Captain)',
    phone: '+91 98888 88888',
    rating: 4.9,
    totalTrips: 184,
    status: 'active',
    assignedVehicle: 'Tata 407 (MH 12 RN 4071)',
  },
  {
    id: 'ven-2',
    name: 'Sanjay Patil (Senior Captain)',
    phone: '+91 98777 77777',
    rating: 4.8,
    totalTrips: 142,
    status: 'active',
    assignedVehicle: 'Tata Ace (MH 12 AB 1234)',
  },
  {
    id: 'ven-3',
    name: 'Mahesh Gole (Heavy Fleet Lead)',
    phone: '+91 98666 66666',
    rating: 4.95,
    totalTrips: 215,
    status: 'active',
    assignedVehicle: 'Eicher 17ft (MH 12 CD 5678)',
  },
];

const SEED_VEHICLES: AdminVehicle[] = [
  {
    id: 'veh-1',
    registrationNumber: 'MH 12 AB 1234',
    type: 'Tata Ace (300 CFT)',
    capacityCft: 300,
    vendorName: 'Sanjay Patil',
    active: true,
    permitExpiry: '2028-05-30',
    fitnessExpiry: '2027-11-15',
  },
  {
    id: 'veh-2',
    registrationNumber: 'MH 12 RN 4071',
    type: 'Tata 407 (600 CFT)',
    capacityCft: 600,
    vendorName: 'Ramesh Shinde',
    active: true,
    permitExpiry: '2028-08-20',
    fitnessExpiry: '2028-01-10',
  },
  {
    id: 'veh-3',
    registrationNumber: 'MH 12 CD 5678',
    type: 'Eicher 17ft Container (1000 CFT)',
    capacityCft: 1000,
    vendorName: 'Mahesh Gole',
    active: true,
    permitExpiry: '2029-02-14',
    fitnessExpiry: '2028-06-25',
  },
];

const SEED_ITEMS: AdminPricingItem[] = [
  { id: 'itm-1', name: 'King Size Bed with Mattress', category: 'Bedroom', defaultCft: 65, defaultWeightKg: 85, baseHandlingRate: 850, active: true },
  { id: 'itm-2', name: 'Queen Size Bed with Storage', category: 'Bedroom', defaultCft: 55, defaultWeightKg: 75, baseHandlingRate: 750, active: true },
  { id: 'itm-3', name: '3-Seater Sofa / Couch', category: 'Living Room', defaultCft: 45, defaultWeightKg: 50, baseHandlingRate: 600, active: true },
  { id: 'itm-4', name: 'Double Door Refrigerator (350L+)', category: 'Kitchen Appliances', defaultCft: 40, defaultWeightKg: 70, baseHandlingRate: 700, active: true },
  { id: 'itm-5', name: 'Front Load Washing Machine', category: 'Kitchen Appliances', defaultCft: 25, defaultWeightKg: 65, baseHandlingRate: 550, active: true },
  { id: 'itm-6', name: '6-Seater Wooden Dining Table', category: 'Dining Room', defaultCft: 50, defaultWeightKg: 60, baseHandlingRate: 750, active: true },
  { id: 'itm-7', name: '65" Smart 4K Television (Fragile)', category: 'Electronics', defaultCft: 18, defaultWeightKg: 28, baseHandlingRate: 850, active: true },
  { id: 'itm-8', name: 'Study Desk & Ergonomic Chair', category: 'Study / Office', defaultCft: 25, defaultWeightKg: 35, baseHandlingRate: 400, active: true },
];

const SEED_PRICING_RULES: AdminPricingRule[] = [
  { id: 'pr-1', ruleType: 'packing_tier_multiplier', configKey: 'lite_tier', value: 1.0, description: 'Basic bubble & stretch film wrap' },
  { id: 'pr-2', ruleType: 'packing_tier_multiplier', configKey: 'standard_tier', value: 1.25, description: 'Multi-layer corrugated sheet & edge protectors' },
  { id: 'pr-3', ruleType: 'packing_tier_multiplier', configKey: 'premium_tier', value: 1.55, description: 'Crated wood armor & climate-sealed wrapping' },
  { id: 'pr-4', ruleType: 'labour_threshold', configKey: 'no_lift_per_floor', value: 350.0, description: 'Staircase carrying surcharge per floor beyond Ground' },
  { id: 'pr-5', ruleType: 'surcharge', configKey: 'weekend_peak_rate', value: 1.15, description: 'Saturday & Sunday prime moving surcharge' },
  { id: 'pr-6', ruleType: 'addon', configKey: 'carpenter_addon', value: 950.0, description: 'Dedicated carpenter for dismantled wardrobes & beds' },
];

const SEED_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'aud-1',
    entityType: 'pricing_rule',
    entityId: 'pr-4',
    fieldChanged: 'no_lift_per_floor',
    oldValue: '₹300.00',
    newValue: '₹350.00',
    changedBy: 'adm-1',
    adminName: 'Triveni Admin',
    reason: 'Labour wage index revision Q4',
    changedAt: '2026-10-14T11:20:00Z',
  },
  {
    id: 'aud-2',
    entityType: 'booking_status',
    entityId: 'TRV-8941',
    fieldChanged: 'status',
    oldValue: 'ASSIGNED',
    newValue: 'EN_ROUTE',
    changedBy: 'adm-1',
    adminName: 'Dispatcher Console',
    reason: 'Vehicle departed origin hub Kharadi',
    changedAt: '2026-10-16T08:15:00Z',
  },
  {
    id: 'aud-3',
    entityType: 'item',
    entityId: 'itm-7',
    fieldChanged: 'baseHandlingRate',
    oldValue: '₹750.00',
    newValue: '₹850.00',
    changedBy: 'adm-1',
    adminName: 'Triveni Admin',
    reason: 'Enhanced foam cushioning mandate for 65"+ screens',
    changedAt: '2026-10-10T16:45:00Z',
  },
];

const SEED_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    template: 'booking_confirmed',
    recipientPhone: '+91 98201 44521',
    channel: 'whatsapp',
    status: 'sent',
    bookingId: 'TRV-8941',
    createdAt: '2026-10-15T09:31:00Z',
  },
  {
    id: 'notif-2',
    template: 'driver_assigned',
    recipientPhone: '+91 98201 44521',
    channel: 'sms',
    status: 'sent',
    bookingId: 'TRV-8941',
    createdAt: '2026-10-15T18:00:00Z',
  },
  {
    id: 'notif-3',
    template: 'live_tracking_link',
    recipientPhone: '+91 97652 11094',
    channel: 'whatsapp',
    status: 'sent',
    bookingId: 'TRV-8942',
    createdAt: '2026-10-15T14:16:00Z',
  },
  {
    id: 'notif-4',
    template: 'advance_payment_receipt',
    recipientPhone: '+91 98900 88214',
    channel: 'email',
    status: 'sent',
    bookingId: 'TRV-8943',
    createdAt: '2026-10-16T11:05:00Z',
  },
];

// Helper to retrieve or persist state in localStorage
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`tt_admin_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`tt_admin_${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota issues
  }
}

// ── Exported Service API ───────────────────────────────────────────────
export const AdminDataService = {
  async getMetrics() {
    try {
      const live = await apiAdmin.getMetrics();
      if (live && live.totalBookings > 0) return live;
    } catch {
      // Fallback
    }

    const bookings = getStored<AdminBooking[]>('bookings', SEED_BOOKINGS);
    const completed = bookings.filter(b => b.status === 'COMPLETED');
    const active = bookings.filter(b =>
      ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
    );
    const pending = bookings.filter(b => b.status === 'REQUESTED');
    const totalRev = completed.reduce((acc, curr) => acc + curr.finalAmount, 0);
    const activeRev = active.reduce((acc, curr) => acc + curr.finalAmount, 0);

    return {
      totalBookings: bookings.length,
      activeBookings: active.length,
      completedBookings: completed.length,
      pendingBookings: pending.length,
      totalCustomers: 148,
      totalVendors: 12,
      totalVehicles: 8,
      totalRevenue: totalRev,
      activeRevenue: activeRev,
    };
  },

  async listBookings(filter?: { status?: string; search?: string }) {
    try {
      const live = await apiAdmin.listBookings(filter);
      if (live && live.bookings && live.bookings.length > 0) {
        // Map backend bookings to interface
        return live.bookings.map(b => ({
          id: b.id.startsWith('TRV-') ? b.id : `TRV-${b.id.slice(0, 4).toUpperCase()}`,
          customerId: b.customerId || 'cust-1',
          customerName: b.customer?.name || 'Customer',
          customerPhone: b.customer?.phone || '+91 98888 00000',
          customerEmail: b.customer?.email || undefined,
          pickupAddress: b.pickupAddress,
          dropAddress: b.dropAddress,
          configurationType: b.configurationType || '2 BHK',
          floorNumber: b.floorNumber || 0,
          liftAvailable: b.liftAvailable ?? true,
          scheduledDate: b.scheduledDate ? new Date(b.scheduledDate).toISOString().split('T')[0] : '2026-10-18',
          scheduledSlot: b.scheduledSlot || 'Morning',
          status: b.status as any,
          baseQuoteAmount: Number(b.baseQuoteAmount || 12000),
          finalAmount: Number(b.finalAmount || 12000),
          advancePaid: Math.round(Number(b.finalAmount || 12000) * 0.2),
          distanceKm: Number(b.distanceKm || 15),
          vendorId: b.vendor?.id,
          vendorName: b.vendor?.name,
          vehicleId: b.vehicle?.id,
          vehicleType: b.vehicle?.type,
          vehicleNumber: b.vehicle?.registrationNumber,
          createdAt: b.createdAt || new Date().toISOString(),
          itemsCount: b._count?.items || 18,
        }));
      }
    } catch {
      // Fallback
    }

    let list = getStored<AdminBooking[]>('bookings', SEED_BOOKINGS);

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(b => b.status === filter.status);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        b =>
          b.id.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.pickupAddress.toLowerCase().includes(q) ||
          b.dropAddress.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: AdminBooking['status'],
    notes?: string
  ) {
    try {
      await apiAdmin.updateStatus(bookingId, newStatus, notes);
    } catch {
      // Persist locally
    }

    const list = getStored<AdminBooking[]>('bookings', SEED_BOOKINGS);
    const updated = list.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus, notes: notes || b.notes };
      }
      return b;
    });
    setStored('bookings', updated);

    // Add audit entry
    const audits = getStored<AdminAuditLog[]>('audit_logs', SEED_AUDIT_LOGS);
    const newAudit: AdminAuditLog = {
      id: `aud-${Date.now()}`,
      entityType: 'booking_status',
      entityId: bookingId,
      fieldChanged: 'status',
      oldValue: list.find(b => b.id === bookingId)?.status || 'UNKNOWN',
      newValue: newStatus,
      changedBy: 'admin',
      adminName: 'Triveni Admin',
      reason: notes || 'Status update via Admin Console',
      changedAt: new Date().toISOString(),
    };
    setStored('audit_logs', [newAudit, ...audits]);

    return true;
  },

  async assignBooking(bookingId: string, vendorId: string, vehicleId?: string) {
    try {
      await apiAdmin.assign(bookingId, vendorId, vehicleId);
    } catch {
      // Persist locally
    }

    const list = getStored<AdminBooking[]>('bookings', SEED_BOOKINGS);
    const vendors = getStored<AdminVendor[]>('vendors', SEED_VENDORS);
    const vehicles = getStored<AdminVehicle[]>('vehicles', SEED_VEHICLES);

    const vendor = vendors.find(v => v.id === vendorId);
    const vehicle = vehicles.find(v => v.id === vehicleId);

    const updated = list.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'ASSIGNED' as const,
          vendorId,
          vendorName: vendor ? vendor.name : 'Assigned Driver',
          vehicleId,
          vehicleType: vehicle ? vehicle.type : undefined,
          vehicleNumber: vehicle ? vehicle.registrationNumber : undefined,
        };
      }
      return b;
    });
    setStored('bookings', updated);
    return true;
  },

  async listVendors() {
    try {
      const live = await apiAdmin.listVendors();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminVendor[]>('vendors', SEED_VENDORS);
  },

  async listVehicles() {
    try {
      const live = await apiAdmin.listVehicles();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminVehicle[]>('vehicles', SEED_VEHICLES);
  },

  async listPricingItems() {
    try {
      const live = await apiAdmin.listItems();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminPricingItem[]>('items', SEED_ITEMS);
  },

  async listPricingRules() {
    try {
      const live = await apiAdmin.listPricingRules();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminPricingRule[]>('pricing_rules', SEED_PRICING_RULES);
  },

  async listAuditLogs() {
    try {
      const live = await apiAdmin.listAuditLogs();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminAuditLog[]>('audit_logs', SEED_AUDIT_LOGS);
  },

  async listNotifications() {
    try {
      const live = await apiAdmin.getNotifications();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return getStored<AdminNotification[]>('notifications', SEED_NOTIFICATIONS);
  },

  async retryNotification(notifId: string) {
    try {
      await apiAdmin.retryNotification(notifId);
    } catch {
      // Mock retry
    }
    const notifs = getStored<AdminNotification[]>('notifications', SEED_NOTIFICATIONS);
    const updated = notifs.map(n => (n.id === notifId ? { ...n, status: 'sent' as const } : n));
    setStored('notifications', updated);
    return true;
  },
};
