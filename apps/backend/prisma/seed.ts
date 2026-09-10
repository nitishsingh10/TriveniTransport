/**
 * Prisma seed script — inserts base data for Triveni Transports
 *
 * Run with: pnpm --filter backend db:seed
 *
 * Seeds:
 *  - 1 AdminUser
 *  - 1 Vendor (Triveni Transports)
 *  - 3 Vehicles (Tata Ace 300 CFT, Tata 407 600 CFT, Eicher 17ft 1000 CFT)
 *  - LocationZones for Pune metropolitan area
 *  - ZoneRates for core zone pairs
 *  - Sample Items (furniture categories)
 *  - PricingRules (packing tiers, labour thresholds, surcharges)
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Admin User ───────────────────────────────────────────────
  const adminId = randomUUID();
  const admin = await prisma.adminUser.upsert({
    where: { phone: process.env.ADMIN_PHONE ?? '9999999999' },
    update: {},
    create: {
      id: adminId,
      name: 'Triveni Admin',
      phone: process.env.ADMIN_PHONE ?? '9999999999',
    },
  });
  console.log('✅ AdminUser:', admin.phone);

  // ── Vendor ───────────────────────────────────────────────────
  const vendorId = randomUUID();
  const vendor = await prisma.vendor.upsert({
    where: { phone: '9888888888' },
    update: {},
    create: {
      id: vendorId,
      name: 'Triveni Transports Packers & Movers',
      phone: '9888888888',
      status: 'active',
      serviceAreas: [],
    },
  });
  console.log('✅ Vendor:', vendor.name);

  // ── Vehicles ─────────────────────────────────────────────────
  const now = new Date();
  const futureDate = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNumber: 'MH12AB1234' },
      update: {},
      create: {
        vendorId: vendor.id,
        type: 'Tata Ace',
        capacityCft: 300,
        registrationNumber: 'MH12AB1234',
        permitExpiry: futureDate,
        fitnessCertExpiry: futureDate,
        active: true,
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'MH12CD5678' },
      update: {},
      create: {
        vendorId: vendor.id,
        type: 'Tata 407',
        capacityCft: 600,
        registrationNumber: 'MH12CD5678',
        permitExpiry: futureDate,
        fitnessCertExpiry: futureDate,
        active: true,
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'MH12EF9012' },
      update: {},
      create: {
        vendorId: vendor.id,
        type: 'Eicher 17ft',
        capacityCft: 1000,
        registrationNumber: 'MH12EF9012',
        permitExpiry: futureDate,
        fitnessCertExpiry: futureDate,
        active: true,
      },
    }),
  ]);
  console.log('✅ Vehicles:', vehicles.map((v) => v.type).join(', '));

  // ── Location Zones (Mumbai/Thane & Long Routes) ──────────────────
  const zones = await Promise.all([
    prisma.locationZone.create({
      data: {
        name: 'Thane',
        zoneType: 'core',
        pincodes: ['400601', '400602', '400604', '400605', '400606', '400607', '400615'],
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Mumbai South',
        zoneType: 'core',
        pincodes: ['400001', '400002', '400004', '400005', '400008', '400020', '400026'],
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Western Suburbs',
        zoneType: 'core',
        pincodes: ['400050', '400052', '400053', '400058', '400060', '400061', '400092'],
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Eastern Suburbs',
        zoneType: 'core',
        pincodes: ['400071', '400075', '400077', '400078', '400083', '400086'],
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Navi Mumbai',
        zoneType: 'extended',
        pincodes: ['400701', '400703', '400705', '400706', '400708', '400709'],
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Pune',
        zoneType: 'extended',
        pincodes: ['411001', '411002', '411014', '411021', '411038'], // Just a few representative pincodes for the long route
        createdBy: admin.id,
      },
    }),
    prisma.locationZone.create({
      data: {
        name: 'Gujarat (Ahmedabad/Surat)',
        zoneType: 'extended',
        pincodes: ['380001', '395003', '380015'], // Representative pincodes for Gujarat
        createdBy: admin.id,
      },
    }),
  ]);
  console.log('✅ LocationZones:', zones.length, 'zones created');

  // ── Zone Rates ───────────────────────────────────────────────
  const effectiveFrom = new Date();
  const [thane, southMumbai, westernSuburbs, easternSuburbs, naviMumbai, pune, gujarat] = zones;

  // Example Rates
  const zoneRatePairs = [
    { from: thane.id, to: thane.id, rate: 3500 },
    { from: thane.id, to: easternSuburbs.id, rate: 4200 },
    { from: thane.id, to: westernSuburbs.id, rate: 5000 },
    { from: thane.id, to: southMumbai.id, rate: 6500 },
    { from: thane.id, to: naviMumbai.id, rate: 4500 },
    { from: westernSuburbs.id, to: southMumbai.id, rate: 5500 },
    { from: easternSuburbs.id, to: southMumbai.id, rate: 5000 },
    { from: westernSuburbs.id, to: easternSuburbs.id, rate: 4800 },
    { from: naviMumbai.id, to: southMumbai.id, rate: 7000 },
    // Long Routes
    { from: thane.id, to: pune.id, rate: 12000 },
    { from: thane.id, to: gujarat.id, rate: 25000 },
  ];

  await Promise.all(
    zoneRatePairs.map(({ from, to, rate }) =>
      prisma.zoneRate.create({
        data: {
          fromZoneId: from,
          toZoneId: to,
          rate,
          effectiveFrom,
          createdBy: admin.id,
        },
      })
    )
  );

  // Distance band fallback rates
  const bandRates = [
    { band: '0-10km', rate: 3000 },
    { band: '10-25km', rate: 5000 },
    { band: '25-50km', rate: 8000 },
    { band: '50+km', rate: 12000 },
  ];
  await Promise.all(
    bandRates.map(({ band, rate }) =>
      prisma.zoneRate.create({
        data: {
          distanceBand: band,
          rate,
          effectiveFrom,
          createdBy: admin.id,
        },
      })
    )
  );
  console.log('✅ ZoneRates:', zoneRatePairs.length + bandRates.length, 'rates created');

  // ── Items (Furniture & Household Catalog) ────────────────────
  const items = [
    // Bedroom
    { name: 'Double Bed (with mattress)', category: 'Bedroom', defaultCft: 80, defaultWeightKg: 60, baseHandlingRate: 800 },
    { name: 'Single Bed (with mattress)', category: 'Bedroom', defaultCft: 50, defaultWeightKg: 35, baseHandlingRate: 500 },
    { name: 'Wardrobe (3-door)', category: 'Bedroom', defaultCft: 90, defaultWeightKg: 80, baseHandlingRate: 1200 },
    { name: 'Wardrobe (2-door)', category: 'Bedroom', defaultCft: 60, defaultWeightKg: 55, baseHandlingRate: 900 },
    { name: 'Dressing Table', category: 'Bedroom', defaultCft: 25, defaultWeightKg: 20, baseHandlingRate: 400 },
    // Living Room
    { name: 'Sofa (3-seater)', category: 'Living Room', defaultCft: 60, defaultWeightKg: 50, baseHandlingRate: 700 },
    { name: 'Sofa (2-seater)', category: 'Living Room', defaultCft: 40, defaultWeightKg: 35, baseHandlingRate: 500 },
    { name: 'TV Unit / Entertainment Unit', category: 'Living Room', defaultCft: 30, defaultWeightKg: 25, baseHandlingRate: 400 },
    { name: 'Coffee Table', category: 'Living Room', defaultCft: 15, defaultWeightKg: 10, baseHandlingRate: 200 },
    { name: 'Recliner', category: 'Living Room', defaultCft: 35, defaultWeightKg: 30, baseHandlingRate: 450 },
    // Kitchen
    { name: 'Refrigerator (Single Door)', category: 'Kitchen', defaultCft: 20, defaultWeightKg: 40, baseHandlingRate: 600 },
    { name: 'Refrigerator (Double Door)', category: 'Kitchen', defaultCft: 30, defaultWeightKg: 65, baseHandlingRate: 900 },
    { name: 'Washing Machine (Front Load)', category: 'Kitchen', defaultCft: 20, defaultWeightKg: 70, baseHandlingRate: 700 },
    { name: 'Washing Machine (Top Load)', category: 'Kitchen', defaultCft: 18, defaultWeightKg: 40, baseHandlingRate: 500 },
    { name: 'Microwave', category: 'Kitchen', defaultCft: 5, defaultWeightKg: 12, baseHandlingRate: 200 },
    { name: 'Dishwasher', category: 'Kitchen', defaultCft: 15, defaultWeightKg: 45, baseHandlingRate: 500 },
    // Electronics
    { name: 'LED TV (32-43 inch)', category: 'Electronics', defaultCft: 8, defaultWeightKg: 8, baseHandlingRate: 300 },
    { name: 'LED TV (50+ inch)', category: 'Electronics', defaultCft: 15, defaultWeightKg: 15, baseHandlingRate: 500 },
    { name: 'Desktop Computer / Monitor', category: 'Electronics', defaultCft: 8, defaultWeightKg: 10, baseHandlingRate: 250 },
    { name: 'AC (Split Unit — indoor + outdoor)', category: 'Electronics', defaultCft: 25, defaultWeightKg: 35, baseHandlingRate: 800 },
    // Dining
    { name: 'Dining Table (4-seater)', category: 'Dining', defaultCft: 40, defaultWeightKg: 30, baseHandlingRate: 500 },
    { name: 'Dining Table (6-seater)', category: 'Dining', defaultCft: 55, defaultWeightKg: 45, baseHandlingRate: 700 },
    { name: 'Dining Chair', category: 'Dining', defaultCft: 6, defaultWeightKg: 5, baseHandlingRate: 100 },
    // Cartons
    { name: 'Carton Box (Medium)', category: 'Carton', defaultCft: 5, defaultWeightKg: 15, baseHandlingRate: 150 },
    { name: 'Carton Box (Large)', category: 'Carton', defaultCft: 8, defaultWeightKg: 20, baseHandlingRate: 200 },
  ];

  await Promise.all(
    items.map((item) =>
      prisma.item.create({
        data: {
          ...item,
          active: true,
          effectiveFrom,
          createdBy: admin.id,
        },
      })
    )
  );
  console.log('✅ Items:', items.length, 'catalog items created');

  // ── Pricing Rules ────────────────────────────────────────────
  const pricingRules = [
    // Packing tier multipliers
    { ruleType: 'packing_tier_multiplier' as const, configKey: 'lite_tier', value: 0.8 },
    { ruleType: 'packing_tier_multiplier' as const, configKey: 'standard_tier', value: 1.0 },
    { ruleType: 'packing_tier_multiplier' as const, configKey: 'premium_tier', value: 1.35 },
    // Labour thresholds
    { ruleType: 'labour_threshold' as const, configKey: 'baseline_cft', value: 400 },
    { ruleType: 'labour_threshold' as const, configKey: 'threshold_block_size', value: 100 },
    { ruleType: 'labour_threshold' as const, configKey: 'per_extra_laborer_rate', value: 500 },
    // Surcharges
    { ruleType: 'surcharge' as const, configKey: 'no_lift_per_floor', value: 200 },      // ₹200 per floor, no lift
    { ruleType: 'surcharge' as const, configKey: 'monsoon_start_month', value: 6 },      // June
    { ruleType: 'surcharge' as const, configKey: 'monsoon_end_month', value: 9 },        // September
    { ruleType: 'surcharge' as const, configKey: 'monsoon_surcharge_percent', value: 10 }, // 10% surcharge
    // Add-ons
    { ruleType: 'addon' as const, configKey: 'carpenter_addon', value: 500 },
    { ruleType: 'addon' as const, configKey: 'electrician_addon', value: 500 },
    { ruleType: 'addon' as const, configKey: 'carton_retention_addon', value: 200 },
  ];

  await Promise.all(
    pricingRules.map((rule) =>
      prisma.pricingRule.create({
        data: {
          ...rule,
          effectiveFrom,
          createdBy: admin.id,
        },
      })
    )
  );
  console.log('✅ PricingRules:', pricingRules.length, 'rules created');

  console.log('\n🎉 Seed complete!');
  console.log('   Admin phone:', admin.phone);
  console.log('   Vendor:', vendor.name);
  console.log('   Vehicles:', vehicles.length);
  console.log('   Zones:', zones.length);
  console.log('   Zone rates:', zoneRatePairs.length + bandRates.length);
  console.log('   Catalog items:', items.length);
  console.log('   Pricing rules:', pricingRules.length);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
