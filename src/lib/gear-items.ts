import type { GearItem, GearItemStatus } from "@/types";

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

export function getCategoryTotalWeightLbs(items: GearItem[]): number {
  return items.reduce((sum, item) => {
    if (typeof item.weight_lbs === "number" && item.weight_lbs > 0) {
      return sum + item.weight_lbs;
    }
    return sum;
  }, 0);
}

/** Category highlight follows the least-complete item: needed → staged → packed. */
export function getCategoryStatus(items: GearItem[]): GearItemStatus | null {
  if (items.length === 0) {
    return null;
  }
  if (items.some((item) => item.status === "missing")) {
    return "missing";
  }
  if (items.some((item) => item.status === "staged")) {
    return "staged";
  }
  return "packed";
}

const CATEGORY_STATUS_STYLES: Record<
  GearItemStatus,
  { header: string; border: string; subtitle: string }
> = {
  missing: {
    header: "bg-status-missing-bg/35",
    border: "border-status-missing-border/45",
    subtitle: "text-status-missing-fg",
  },
  staged: {
    header: "bg-status-staged-bg/35",
    border: "border-status-staged-border/45",
    subtitle: "text-status-staged-fg",
  },
  packed: {
    header: "bg-status-packed-bg/40",
    border: "border-status-packed-border/45",
    subtitle: "text-status-packed-fg",
  },
};

export function getCategoryStatusStyles(status: GearItemStatus | null): {
  header: string;
  border: string;
  subtitle: string;
} {
  if (!status) {
    return {
      header: "bg-accent/8",
      border: "border-border",
      subtitle: "text-muted",
    };
  }
  return CATEGORY_STATUS_STYLES[status];
}
