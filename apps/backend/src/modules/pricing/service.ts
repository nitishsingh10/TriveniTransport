import { prisma } from '../../config/prisma';
import { getRedis } from '../../config/redis';
import { InstantEstimateInput, ItemizedQuoteInput, TransportQuoteInput } from '@triveni/shared-validation';
import { TransportVehicleConfig, TransportVehicleType } from '@triveni/shared-types';
import { GeocodingService } from '../geocoding/service';
import { ZoneService } from '../geocoding/zoneService';

export const TRANSPORT_VEHICLES: Record<TransportVehicleType, TransportVehicleConfig> = {
  tata_ace: {
    type: 'tata_ace',
    displayName: 'Tata Ace (Chota Hathi)',
    capacityCft: 300,
    payloadKg: 750,
    dimensions: '7ft × 4.5ft × 5ft',
    baseRate: 650,      // base fare for initial 4 km
    baseKm: 4,
    perKmRate: 28,      // per km after 4 km
    helperRate: 350,    // per helper
    description: 'Best for 1 RK, single appliances, boxes, or quick city pickup-drop.',
    recommendedFor: '1 RK / Few Furniture / Electronics',
  },
  tata_407: {
    type: 'tata_407',
    displayName: 'Tata 407 (9ft / 10ft)',
    capacityCft: 600,
    payloadKg: 1800,
    dimensions: '10ft × 6ft × 6ft',
    baseRate: 1400,     // base fare for initial 4 km
    baseKm: 4,
    perKmRate: 42,      // per km after 4 km
    helperRate: 450,
    description: 'Ideal for 1-2 BHK household items or medium commercial freight.',
    recommendedFor: '1-2 BHK / Moderate Cargo',
  },
  eicher_17ft: {
    type: 'eicher_17ft',
    displayName: 'Eicher 17ft (Heavy Carrier)',
    capacityCft: 1000,
    payloadKg: 4000,
    dimensions: '17ft × 7ft × 7ft',
    baseRate: 2800,     // base fare for initial 5 km
    baseKm: 5,
    perKmRate: 65,      // per km after 5 km
    helperRate: 600,
    description: 'Heavy duty truck for large home relocations or full industrial freight.',
    recommendedFor: '3+ BHK / Industrial / Bulk Goods',
  },
};

export class PricingService {
  /**
   * Layer-1 Instant Estimate
   * Fast, relies on cached matrix or fallback heuristic rules.
   */
  static async getInstantEstimate(input: InstantEstimateInput) {
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

    // 4. Dynamic Route & Zone Rate Calculation
    const route = await GeocodingService.calculateDistanceKm(input.pickupAddress, input.dropAddress);
    const distanceKm = route.distanceKm || 15.0;

    const pickupZone = await ZoneService.resolveZoneForAddress(input.pickupAddress);
    const dropZone = await ZoneService.resolveZoneForAddress(input.dropAddress);

    let distanceBand = '10-25km';
    if (distanceKm <= 10) distanceBand = '0-10km';
    else if (distanceKm <= 25) distanceBand = '10-25km';
    else if (distanceKm <= 50) distanceBand = '25-50km';
    else distanceBand = '50+km';

    let zoneCharge = 3500;
    let appliedZoneRateId: string | null = null;

    if (pickupZone && dropZone) {
      // 4a. Check direct pair
      let zoneRate = await prisma.zoneRate.findFirst({
        where: {
          fromZoneId: pickupZone.id,
          toZoneId: dropZone.id,
          effectiveTo: null,
        },
      });

      // 4b. Check reciprocal pair
      if (!zoneRate) {
        zoneRate = await prisma.zoneRate.findFirst({
          where: {
            fromZoneId: dropZone.id,
            toZoneId: pickupZone.id,
            effectiveTo: null,
          },
        });
      }

      // 4c. Check distance band rate
      if (!zoneRate) {
        zoneRate = await prisma.zoneRate.findFirst({
          where: {
            distanceBand,
            effectiveTo: null,
          },
        });
      }

      if (zoneRate) {
        zoneCharge = Number(zoneRate.rate);
        appliedZoneRateId = zoneRate.id;
      } else {
        // Fallback default according to distance band
        if (distanceKm <= 10) zoneCharge = 3000;
        else if (distanceKm <= 25) zoneCharge = 4500;
        else if (distanceKm <= 50) zoneCharge = 7000;
        else zoneCharge = 12000;
      }
    }

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
      distanceKm,
      durationMins: route.durationMins,
      pickupZone: { id: pickupZone.id, name: pickupZone.name },
      dropZone: { id: dropZone.id, name: dropZone.name },
      appliedZoneRateId,
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
        distanceKm,
        durationMins: route.durationMins,
      },
      snapshot: pricingSnapshot,
    };
  }

  /**
   * Transport & Trucks / Pickup-Drop Service
   * Returns available vehicle options with estimated prices if distance is known.
   */
  static getTransportVehicles(distanceKm?: number) {
    return Object.values(TRANSPORT_VEHICLES).map((v) => {
      let estimatedCost: number | undefined;
      if (typeof distanceKm === 'number' && distanceKm > 0) {
        const extraKm = Math.max(0, distanceKm - v.baseKm);
        estimatedCost = Math.round(v.baseRate + extraKm * v.perKmRate);
      }
      return {
        ...v,
        estimatedCost,
      };
    });
  }

  /**
   * Calculates a transparent, distance-based quote for transport / pickup-drop service.
   */
  static async calculateTransportQuote(input: TransportQuoteInput) {
    const now = new Date();
    const vehicleKey = (input.vehicleType as TransportVehicleType) || 'tata_ace';
    const vehicle = TRANSPORT_VEHICLES[vehicleKey] || TRANSPORT_VEHICLES.tata_ace;

    // 1. Calculate road distance & duration
    const route = await GeocodingService.calculateDistanceKm(input.pickupAddress, input.dropAddress);
    const distanceKm = Math.max(1, route.distanceKm || 10.0);

    // 2. Resolve zones for geographic context
    const pickupZone = await ZoneService.resolveZoneForAddress(input.pickupAddress);
    const dropZone = await ZoneService.resolveZoneForAddress(input.dropAddress);

    // 3. Distance calculation
    const extraKm = Math.max(0, distanceKm - vehicle.baseKm);
    const baseTripCharge = vehicle.baseRate;
    const distanceCharge = Math.round(extraKm * vehicle.perKmRate);

    // 4. Helper / loading assistance charge
    const helperCount = Math.max(0, Math.min(4, input.helperCount || 0));
    const helperCharge = helperCount * vehicle.helperRate;

    // 5. Long distance toll estimate (>50km highway)
    let tollOrSurcharges = 0;
    if (distanceKm > 50) {
      tollOrSurcharges += 200;
    }

    const totalAmount = Math.round(baseTripCharge + distanceCharge + helperCharge + tollOrSurcharges);

    const snapshot = {
      serviceType: 'transport' as const,
      timestamp: now.toISOString(),
      vehicleType: vehicleKey,
      vehicleName: vehicle.displayName,
      vehicleCapacityCft: vehicle.capacityCft,
      vehiclePayloadKg: vehicle.payloadKg,
      dimensions: vehicle.dimensions,
      distanceKm,
      durationMins: route.durationMins,
      helperCount,
      goodsType: input.goodsType || 'General Cargo',
      baseTripCharge,
      distanceCharge,
      helperCharge,
      tollOrSurcharges,
      finalTotal: totalAmount,
      pickupZone: pickupZone ? { id: pickupZone.id, name: pickupZone.name } : null,
      dropZone: dropZone ? { id: dropZone.id, name: dropZone.name } : null,
      inputs: input,
      items: input.items || [],
      paymentMethod: input.paymentMethod || 'cash_on_delivery',
    };

    return {
      serviceType: 'transport' as const,
      quoteAmount: totalAmount,
      breakdown: {
        baseTripCharge,
        distanceCharge,
        helperCharge,
        tollOrSurcharges,
      },
      metrics: {
        vehicleType: vehicleKey,
        vehicleName: vehicle.displayName,
        distanceKm,
        durationMins: route.durationMins,
        helperCount,
        capacityCft: vehicle.capacityCft,
        payloadKg: vehicle.payloadKg,
      },
      snapshot,
    };
  }
}
