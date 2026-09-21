import { prisma } from '../../config/prisma';
import { getRedis } from '../../config/redis';
import { InstantEstimateInput, ItemizedQuoteInput } from '@triveni/shared-validation';

export class PricingService {
  /**
   * Layer-1 Instant Estimate
   * Fast, relies on cached matrix or fallback heuristic rules.
   */
  static async getInstantEstimate(input: InstantEstimateInput) {
    // In a full implementation, we'd geocode the pickup/drop addresses,
    // match them to LocationZones, and fetch the ZoneRate from Redis cache.
    // For now, we simulate a fast estimate based on the configurationType.
    
    let baseRate = 3000;
    if (input.configurationType === '2bhk') baseRate = 5000;
    if (input.configurationType === '3bhk') baseRate = 8000;
    if (input.configurationType === 'office') baseRate = 12000;

    return {
      minEstimate: baseRate * 0.9,
      maxEstimate: baseRate * 1.3,
      currency: 'INR',
      disclaimer: 'This is an instant range estimate. Please proceed to itemized inventory for an exact quote.',
    };
  }

  /**
   * Layer-2 Itemized Calculation (The 8-step engine)
   */
  static async calculateItemizedQuote(input: ItemizedQuoteInput, customerId?: string) {
    // 1. Fetch active pricing rules & current timestamp
    const now = new Date();
    const activeRules = await prisma.pricingRule.findMany({
      where: {
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
    });

    const getRule = (key: string) => {
      const rule = activeRules.find((r) => r.configKey === key);
      return rule ? Number(rule.value) : 0;
    };

    // 2. Fetch Item master data for everything in the checklist
    const itemIds = input.items.map((i) => i.itemId).filter(Boolean) as string[];
    const itemsMaster = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        active: true,
      },
    });
    const itemMap = new Map(itemsMaster.map((i) => [i.id, i]));

    // 3. Process goods and subtotal
    let goodsSubtotal = 0;
    let totalCft = 0;
    let totalWeight = 0;
    const itemSnapshots = [];

    const liteTier = getRule('lite_tier') || 0.8;
    const stdTier = getRule('standard_tier') || 1.0;
    const premTier = getRule('premium_tier') || 1.35;

    for (const cli of input.items) {
      let baseRate = 500;
      let cft = cli.customCft || 20;
      let weight = 20;

      if (cli.itemId) {
        const master = itemMap.get(cli.itemId);
        if (master) {
          baseRate = Number(master.baseHandlingRate);
          cft = cli.customCft || Number(master.defaultCft);
          weight = Number(master.defaultWeightKg);
        }
      }

      // Apply packing tier multiplier
      let multiplier = stdTier;
      if (cli.packingTier === 'lite') multiplier = liteTier;
      if (cli.packingTier === 'premium') multiplier = premTier;

      const itemCost = baseRate * cli.quantity * multiplier;
      
      goodsSubtotal += itemCost;
      totalCft += cft * cli.quantity;
      totalWeight += weight * cli.quantity;

      itemSnapshots.push({
        ...cli,
        appliedRate: itemCost,
        baseRate,
        multiplier,
      });
    }

    // 4. Zone Rate (mock logic for Geocoding to Zone — in prod, use Google Maps Distance Matrix)
    // Here we assume a flat baseline or a fallback distance band rate
    const zoneCharge = 3500; // Mocked

    // 5. Labour Charge
    const baselineCft = getRule('baseline_cft') || 400;
    const blockCft = getRule('threshold_block_size') || 100;
    const extraLaborRate = getRule('per_extra_laborer_rate') || 500;
    
    let labourCharge = 0;
    if (totalCft > baselineCft) {
      const extraBlocks = Math.ceil((totalCft - baselineCft) / blockCft);
      labourCharge = extraBlocks * extraLaborRate;
    }

    // 6. Surcharges
    let surcharges = 0;
    if (!input.liftAvailable && input.floorNumber > 0) {
      const floorRate = getRule('no_lift_per_floor') || 200;
      surcharges += floorRate * input.floorNumber;
    }

    // Monsoon logic (e.g., month 6 to 9)
    const month = now.getMonth() + 1; // 1-indexed
    const monsoonStart = getRule('monsoon_start_month') || 6;
    const monsoonEnd = getRule('monsoon_end_month') || 9;
    if (month >= monsoonStart && month <= monsoonEnd) {
      const monsoonPercent = getRule('monsoon_surcharge_percent') || 10;
      surcharges += (goodsSubtotal + zoneCharge) * (monsoonPercent / 100);
    }

    // 7. Add-ons
    let addonsTotal = 0;
    for (const addon of input.addons) {
      const addonRate = getRule(`${addon}_addon`);
      if (addonRate) addonsTotal += addonRate;
    }

    // 8. Total & Snapshot creation
    const finalTotal = goodsSubtotal + zoneCharge + labourCharge + surcharges + addonsTotal;

    const pricingSnapshot = {
      timestamp: now.toISOString(),
      goodsSubtotal,
      zoneCharge,
      labourCharge,
      surcharges,
      addonsTotal,
      finalTotal,
      totalCft,
      totalWeight,
      appliedRules: activeRules.map((r) => ({ id: r.id, key: r.configKey, value: Number(r.value) })),
      items: itemSnapshots,
      inputs: input,
    };

    return {
      quoteAmount: Math.round(finalTotal),
      breakdown: {
        goodsSubtotal: Math.round(goodsSubtotal),
        zoneCharge: Math.round(zoneCharge),
        labourCharge: Math.round(labourCharge),
        surcharges: Math.round(surcharges),
        addonsTotal: Math.round(addonsTotal),
      },
      metrics: {
        totalCft,
        totalWeightKg: totalWeight,
      },
      snapshot: pricingSnapshot,
    };
  }
}
