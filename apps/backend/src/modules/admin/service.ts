import { prisma } from '../../config/prisma';
import { CreateZoneInput, CreateZoneRateInput, CreateItemInput, CreatePricingRuleInput } from '@triveni/shared-validation';
import { BookingStatus } from '@triveni/shared-types';

export class AdminService {
  static async getMetrics() {
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: { status: { in: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'REVISION_PENDING'] } }
    });
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const pendingBookings = await prisma.booking.count({ where: { status: 'REQUESTED' } });

    const totalCustomers = await prisma.customer.count();
    const totalVendors = await prisma.vendor.count();
    const totalVehicles = await prisma.vehicle.count();

    const revenueAggr = await prisma.booking.aggregate({
      _sum: { finalAmount: true },
      where: { status: 'COMPLETED' }
    });

    const activeAggr = await prisma.booking.aggregate({
      _sum: { finalAmount: true },
      where: { status: { in: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } }
    });

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      pendingBookings,
      totalCustomers,
      totalVendors,
      totalVehicles,
      totalRevenue: Number(revenueAggr._sum.finalAmount || 0),
      activeRevenue: Number(activeAggr._sum.finalAmount || 0),
    };
  }

  static async listBookings(params: { status?: string; search?: string; skip?: number; take?: number }) {
    const { status, search, skip = 0, take = 50 } = params;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupAddress: { contains: q, mode: 'insensitive' } },
        { dropAddress: { contains: q, mode: 'insensitive' } },
        { customer: { phone: { contains: q } } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          vendor: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, type: true, registrationNumber: true } },
          payments: { select: { id: true, amount: true, status: true, type: true, createdAt: true } },
          _count: { select: { items: true, revisions: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, skip, take };
  }

  static async getBooking(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vendor: true,
        vehicle: true,
        items: true,
        revisions: true,
        payments: true,
        statusHistory: { orderBy: { timestamp: 'desc' } },
      },
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    return booking;
  }

  static async updateBookingStatus(adminId: string, bookingId: string, newStatus: BookingStatus, notes?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    const fromState = booking.status;
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromState,
        toState: newStatus,
        actorId: adminId,
        actorRole: 'admin',
      },
    });

    return updated;
  }

  static async assignBooking(adminId: string, bookingId: string, vendorId: string, vehicleId?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    const updateData: any = {
      vendorId,
      status: 'ASSIGNED',
    };
    if (vehicleId) {
      updateData.vehicleId = vehicleId;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromState: booking.status,
        toState: 'ASSIGNED',
        actorId: adminId,
        actorRole: 'admin',
      },
    });

    return updated;
  }

  static async listVendors() {
    return prisma.vendor.findMany({
      include: {
        vehicles: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listVehicles() {
    return prisma.vehicle.findMany({
      include: {
        vendor: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  static async listItems() {
    return prisma.item.findMany({
      where: { active: true },
      orderBy: { category: 'asc' },
    });
  }

  static async listPricingRules() {
    return prisma.pricingRule.findMany({
      orderBy: { ruleType: 'asc' },
    });
  }

  static async listZones() {
    return prisma.locationZone.findMany({
      include: {
        fromZoneRates: true,
        toZoneRates: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async listAuditLogs(skip = 0, take = 50) {
    return prisma.pricingAuditLog.findMany({
      include: { admin: { select: { name: true, phone: true } } },
      orderBy: { changedAt: 'desc' },
      skip,
      take,
    });
  }

  static async createZone(adminId: string, input: CreateZoneInput) {
    return prisma.locationZone.create({
      data: {
        name: input.name,
        zoneType: input.zoneType,
        pincodes: input.pincodes,
        createdBy: adminId,
      }
    });
  }

  static async createZoneRate(adminId: string, input: CreateZoneRateInput) {
    return prisma.$transaction(async (tx) => {
      // Create new active rate
      const rate = await tx.zoneRate.create({
        data: {
          fromZoneId: input.fromZoneId,
          toZoneId: input.toZoneId,
          distanceBand: input.distanceBand,
          rate: input.rate,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      // Audit log (append only)
      await tx.pricingAuditLog.create({
        data: {
          entityType: 'zone_rate',
          entityId: rate.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: String(input.rate),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return rate;
    });
  }

  static async createItem(adminId: string, input: CreateItemInput) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: input.name,
          category: input.category,
          defaultCft: input.defaultCft,
          defaultWeightKg: input.defaultWeightKg,
          baseHandlingRate: input.baseHandlingRate,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      await tx.pricingAuditLog.create({
        data: {
          entityType: 'item',
          entityId: item.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: JSON.stringify(input),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return item;
    });
  }

  static async createPricingRule(adminId: string, input: CreatePricingRuleInput) {
    return prisma.$transaction(async (tx) => {
      const rule = await tx.pricingRule.create({
        data: {
          ruleType: input.ruleType,
          configKey: input.configKey,
          value: input.value,
          effectiveFrom: new Date(input.effectiveFrom),
          createdBy: adminId,
        }
      });

      await tx.pricingAuditLog.create({
        data: {
          entityType: 'pricing_rule',
          entityId: rule.id,
          fieldChanged: 'create',
          oldValue: 'null',
          newValue: String(input.value),
          changedBy: adminId,
          reason: input.reason || 'Initial creation',
        }
      });

      return rule;
    });
  }

  static async getNotifications(skip: number = 0, take: number = 50) {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  static async retryNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw { statusCode: 404, message: 'Notification not found' };
    if (notification.status !== 'failed') throw { statusCode: 400, message: 'Only failed notifications can be retried' };

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'queued' }
    });

    const { notificationsQueue } = require('../../jobs/queue');
    await notificationsQueue.add(notification.template, {
      type: notification.template,
      userId: notification.bookingId,
      userRole: notification.recipientRole,
      payload: notification.payload,
      bookingId: notification.bookingId,
    });

    return { message: 'Queued for retry' };
  }
}
