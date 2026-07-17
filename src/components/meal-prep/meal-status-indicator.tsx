import type { MealItemStatus } from "@/types";
import { Check } from "lucide-react";

interface MealStatusIndicatorProps {
  status: MealItemStatus;
}

export function MealStatusIndicator({ status }: MealStatusIndicatorProps) {
  const consumed = status === "consumed";

  return (
    <span
      aria-hidden
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        consumed
          ? "border-status-consumed-border bg-status-consumed-border text-white"
          : "border-status-packed-border bg-background"
      }`}
    >
      {consumed ? <Check className="size-4" strokeWidth={3} /> : null}
    </span>
  );
}

export function mealStatusLabel(status: MealItemStatus): string {
  return status === "consumed" ? "Consumed" : "Available";
}
