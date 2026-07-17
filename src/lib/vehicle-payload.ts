import type { TripRecord } from "@/types";

export type PayloadStatusLevel = "safe" | "warning" | "critical";

export interface PayloadUsage {
  packedWeightLbs: number;
  capacityLbs: number;
  /** True utilization; may exceed 100 when over capacity. */
  percentUsed: number;
  /** Arc fill clamped to 0–100. */
  ringPercent: number;
  remainingLbs: number;
  status: PayloadStatusLevel;
}

/** Sum weight_lbs for packed gear only. Invalid/missing weights contribute 0. */
export function getPackedGearWeightLbs(trip: TripRecord): number {
  let total = 0;

  for (const category of trip.categories) {
    for (const item of category.items) {
      if (item.status !== "packed") continue;
      if (typeof item.weight_lbs !== "number" || !Number.isFinite(item.weight_lbs)) {
        continue;
      }
      if (item.weight_lbs <= 0) continue;
      total += item.weight_lbs;
    }
  }

  return total;
}

/**
 * Thresholds:
 * - safe: below 85%
 * - warning: 85%–95% inclusive
 * - critical: above 95%
 */
export function getPayloadStatus(
  packedLbs: number,
  capacityLbs: number,
): PayloadStatusLevel {
  if (!(capacityLbs > 0) || !Number.isFinite(capacityLbs)) {
    return "safe";
  }

  const percent = (Math.max(0, packedLbs) / capacityLbs) * 100;
  if (percent > 95) return "critical";
  if (percent >= 85) return "warning";
  return "safe";
}

export function getPayloadUsage(
  packedLbs: number,
  capacityLbs: number,
): PayloadUsage | null {
  if (!(capacityLbs > 0) || !Number.isFinite(capacityLbs)) {
    return null;
  }

  const safePacked = Math.max(0, Number.isFinite(packedLbs) ? packedLbs : 0);
  const percentUsed = (safePacked / capacityLbs) * 100;
  const ringPercent = Math.min(100, Math.max(0, percentUsed));

  return {
    packedWeightLbs: safePacked,
    capacityLbs,
    percentUsed,
    ringPercent,
    remainingLbs: capacityLbs - safePacked,
    status: getPayloadStatus(safePacked, capacityLbs),
  };
}
