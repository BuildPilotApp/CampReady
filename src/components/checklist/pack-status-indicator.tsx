import { STATUS_LABELS } from "@/lib/gear-status";
import type { GearItemStatus } from "@/types";
import { Check } from "lucide-react";

interface PackStatusIndicatorProps {
  status: GearItemStatus;
}

export function PackStatusIndicator({ status }: PackStatusIndicatorProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        status === "missing"
          ? "border-status-missing-border bg-background"
          : status === "staged"
            ? "border-status-staged-border bg-status-staged-bg"
            : "border-status-packed-border bg-status-packed-border text-accent-foreground"
      }`}
    >
      {status === "staged" ? (
        <span className="size-2.5 rounded-full bg-status-staged-border" />
      ) : null}
      {status === "packed" ? (
        <Check className="size-4" strokeWidth={3} />
      ) : null}
    </span>
  );
}

export function packStatusLabel(status: GearItemStatus): string {
  return STATUS_LABELS[status];
}
