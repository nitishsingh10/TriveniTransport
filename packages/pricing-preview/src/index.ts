/**
 * Layer-1 Instant Estimate — client-side preview logic
 *
 * This module computes a rough price range from cached reference data,
 * so the user sees a number instantly without a server round-trip.
 *
 * It is deliberately simple and clearly labelled "estimate only".
 * The authoritative quote always comes from the server (Layer-2).
 */

export interface Layer1ReferenceRow {
  configurationType: string;
  pickupZoneId?: string;
  dropZoneId?: string;
  distanceBand?: string; // fallback: "0-10km", "10-25km", "25-50km", "50+"
  low: number;
  high: number;
}

export interface InstantEstimatePreviewInput {
  configurationType: string;
  pickupZoneId?: string;
  dropZoneId?: string;
  distanceKm?: number;
}

export interface InstantEstimatePreviewResult {
  low: number;
  high: number;
  confidence: 'zone-pair' | 'distance-band' | 'no-data';
  disclaimer: string;
}

const DISCLAIMER =
  'This is an approximate range only. Your final itemized quote will be calculated after you complete the inventory checklist.';

/**
 * Map distance in km to the distance band string used in reference rows.
 */
function distanceToBand(km: number): string {
  if (km <= 10) return '0-10km';
  if (km <= 25) return '10-25km';
  if (km <= 50) return '25-50km';
  return '50+km';
}

/**
 * Compute a Layer-1 estimate from a pre-fetched reference table.
 *
 * Call this on the client with data from GET /catalog/layer1-reference
 * (that endpoint returns the Redis-cached reference table, refreshed nightly).
 */
export function computeInstantEstimate(
  input: InstantEstimatePreviewInput,
  referenceTable: Layer1ReferenceRow[]
): InstantEstimatePreviewResult {
  const { configurationType, pickupZoneId, dropZoneId, distanceKm } = input;

  // 1. Try exact zone-pair match
  if (pickupZoneId && dropZoneId) {
    const exact = referenceTable.find(
      (r) =>
        r.configurationType === configurationType &&
        r.pickupZoneId === pickupZoneId &&
        r.dropZoneId === dropZoneId
    );
    if (exact) {
      return { low: exact.low, high: exact.high, confidence: 'zone-pair', disclaimer: DISCLAIMER };
    }
  }

  // 2. Fallback to distance-band match
  if (distanceKm !== undefined) {
    const band = distanceToBand(distanceKm);
    const bandMatch = referenceTable.find(
      (r) =>
        r.configurationType === configurationType &&
        r.distanceBand === band &&
        !r.pickupZoneId // distance-band rows have no zone-pair
    );
    if (bandMatch) {
      return {
        low: bandMatch.low,
        high: bandMatch.high,
        confidence: 'distance-band',
        disclaimer: DISCLAIMER,
      };
    }
  }

  // 3. No data — client should still show the form but skip the range
  return { low: 0, high: 0, confidence: 'no-data', disclaimer: DISCLAIMER };
}

/**
 * Format a price range for display. e.g. "₹8,000 – ₹12,000"
 */
export function formatPriceRange(low: number, high: number): string {
  if (low === 0 && high === 0) return 'Get a free quote';
  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${fmt(low)} – ${fmt(high)}`;
}

/**
 * Packing tier multipliers — kept here so the running total in the checklist
 * UI can update instantly as the user changes packing tier selections.
 */
export const PACKING_TIER_MULTIPLIER: Record<string, number> = {
  lite: 0.8,
  standard: 1.0,
  premium: 1.35,
};

/**
 * Running total preview — sums line items with packing tier applied.
 * Uses base_handling_rate from the item catalog (fetched from GET /catalog/items).
 */
export interface PreviewLineItem {
  baseHandlingRate: number;
  quantity: number;
  packingTier: 'lite' | 'standard' | 'premium';
}

export function computeRunningTotal(lines: PreviewLineItem[]): number {
  return lines.reduce((sum, line) => {
    const multiplier = PACKING_TIER_MULTIPLIER[line.packingTier] ?? 1.0;
    return sum + line.baseHandlingRate * line.quantity * multiplier;
  }, 0);
}
