import type { GearItem, GearSubItem } from "@/types";

/** True when the item or any of its sub-items still need packing. */
export function isGearItemRemaining(item: GearItem): boolean {
  if (item.status !== "packed") {
    return true;
  }
  return (item.subItems ?? []).some((sub) => sub.status !== "packed");
}

export function getCategoryPackCounts(items: GearItem[]): {
  packed: number;
  total: number;
} {
  let packed = 0;
  let total = 0;

  for (const item of items) {
    total += 1;
    if (item.status === "packed") {
      packed += 1;
    }
    for (const sub of item.subItems ?? []) {
      total += 1;
      if (sub.status === "packed") {
        packed += 1;
      }
    }
  }

  return { packed, total };
}

export function flattenGearEntries(
  items: GearItem[],
): Array<{ item: GearItem; subItem?: GearSubItem }> {
  const entries: Array<{ item: GearItem; subItem?: GearSubItem }> = [];

  for (const item of items) {
    entries.push({ item });
    for (const subItem of item.subItems ?? []) {
      entries.push({ item, subItem });
    }
  }

  return entries;
}
