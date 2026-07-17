import type { MealItemStatus } from "@/types";
import { Check } from "lucide-react";

const MEAL_STATUS_STYLES: Record<
  MealItemStatus,
  { className: string; showCheck?: boolean; label: string }
> = {
  available: {
    className:
      "bg-status-missing-bg text-status-missing-fg border-status-missing-border",
    label: "Available",
  },
  consumed: {
    className:
      "bg-status-packed-bg text-status-packed-fg border-status-packed-border",
    showCheck: true,
    label: "Consumed",
  },
};

interface MealStatusBadgeProps {
  status: MealItemStatus;
  compact?: boolean;
  className?: string;
}

export function MealStatusBadge({
  status,
  compact = false,
  className = "",
}: MealStatusBadgeProps) {
  const style = MEAL_STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold ${style.className} ${
        compact ? "min-h-6 px-2 text-xs" : "min-h-7 px-2.5 text-xs"
      } ${className}`}
    >
      {style.showCheck ? (
        <Check
          className={`shrink-0 ${compact ? "size-3" : "size-3.5"}`}
          strokeWidth={3}
          aria-hidden
        />
      ) : null}
      {style.label}
    </span>
  );
}
