import { STATUS_LABELS } from "@/lib/gear-status";
import type { GearItemStatus } from "@/types";
import { Check } from "lucide-react";

const STATUS_STYLES: Record<
  GearItemStatus,
  { className: string; showCheck?: boolean }
> = {
  missing: {
    className:
      "bg-status-missing-bg text-status-missing-fg border-status-missing-border",
  },
  staged: {
    className:
      "bg-status-staged-bg text-status-staged-fg border-status-staged-border",
  },
  packed: {
    className:
      "bg-status-packed-bg text-status-packed-fg border-status-packed-border",
    showCheck: true,
  },
};

interface StatusBadgeProps {
  status: GearItemStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold ${style.className} ${
        compact
          ? "min-h-6 px-2 text-[0.65rem]"
          : "min-h-7 px-2.5 text-xs"
      }`}
    >
      {style.showCheck ? (
        <Check
          className={`shrink-0 ${compact ? "size-3" : "size-3.5"}`}
          strokeWidth={3}
          aria-hidden
        />
      ) : null}
      {STATUS_LABELS[status]}
    </span>
  );
}
