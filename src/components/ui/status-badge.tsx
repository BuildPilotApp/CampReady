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
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-bold uppercase tracking-wide ${style.className}`}
    >
      {style.showCheck ? (
        <Check className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />
      ) : null}
      {STATUS_LABELS[status]}
    </span>
  );
}
