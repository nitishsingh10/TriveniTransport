import { prisma } from '../../config/prisma';
import { CreateZoneInput, CreateZoneRateInput, CreateItemInput, CreatePricingRuleInput } from '@triveni/shared-validation';

export class AdminService {
  static async getMetrics() {
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: { status: { in: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'REVISION_PENDING'] } }
    });

    // Mock revenue calculation (sum of finalAmount for completed bookings)
    const revenueAggr = await prisma.booking.aggregate({
      _sum: { finalAmount: true },
      where: { status: 'COMPLETED' }
    });

    return {
      totalBookings,
      activeBookings,
      totalRevenue: revenueAggr._sum.finalAmount || 0,
    };
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
}
