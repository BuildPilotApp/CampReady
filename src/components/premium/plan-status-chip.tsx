"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { formatFreePlanSummary } from "@/lib/free-tier-copy";
import { Sparkles } from "lucide-react";

interface PlanStatusChipProps {
  onUpgradeClick?: () => void;
  className?: string;
}

export function PlanStatusChip({ onUpgradeClick, className = "" }: PlanStatusChipProps) {
  const { database } = useCampReady();
  const { isPro, openPaywall } = usePro();

  if (isPro) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-500/35 bg-teal-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-teal-300 ${className}`.trim()}
      >
        <Sparkles className="size-3" aria-hidden />
        Pro
      </span>
    );
  }

  const summary = formatFreePlanSummary(
    database.trips.length,
    database.templates.length,
  );

  return (
    <button
      type="button"
      onClick={onUpgradeClick ?? openPaywall}
      className={`inline-flex shrink-0 items-center rounded-full border border-border bg-background/80 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted active:border-accent/40 active:text-foreground ${className}`.trim()}
      aria-label={`${summary}. Upgrade to Pro.`}
    >
      Free Plan
    </button>
  );
}
