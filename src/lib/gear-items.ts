import type { GearItem } from "@/types";

/** True when the item still needs packing. */
export function isGearItemRemaining(item: GearItem): boolean {
  return item.status !== "packed";
}

export function getCategoryPackCounts(items: GearItem[]): {
  packed: number;
  total: number;
} {
  const total = items.length;
  const packed = items.filter((item) => item.status === "packed").length;
  return { packed, total };
}
