"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { GearItem } from "@/types";

interface GearItemRowProps {
  item: GearItem;
}

export function GearItemRow({ item }: GearItemRowProps) {
  const { cycleItemStatus } = useCampReady();
  const packed = item.status === "packed";

  return (
    <button
      type="button"
      onClick={() => cycleItemStatus(item.id)}
      aria-label={`${item.name}, ${item.status}. Tap to change status.`}
      className="flex min-h-14 w-full items-center gap-3 border-b border-border bg-surface px-4 py-3 text-left active:bg-background"
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block text-base font-semibold leading-snug text-foreground ${
            packed ? "line-through opacity-70" : ""
          }`}
        >
          {item.name}
        </span>
        {item.weight_lbs > 0 ? (
          <span className="mt-0.5 block text-xs font-medium text-muted">
            {item.weight_lbs} lb
          </span>
        ) : null}
      </span>
      <StatusBadge status={item.status} />
    </button>
  );
}
