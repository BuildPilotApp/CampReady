"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import {
  formatFreeTemplateUsage,
  formatFreeTripUsage,
} from "@/lib/free-tier-copy";
import {
  FREE_TEMPLATE_LIMIT,
  FREE_TRIP_LIMIT,
  isPrimeTestLabBypassActive,
} from "@/lib/pro";
import { CampSyncMark } from "@/components/ui/camp-sync-mark";

export function FreePlanUsageCard() {
  const { database } = useCampReady();
  const { isPro, openPaywall } = usePro();

  if (isPro || isPrimeTestLabBypassActive()) {
    return null;
  }

  const tripCount = database.trips.length;
  const templateCount = database.templates.length;
  const atTripLimit = tripCount >= FREE_TRIP_LIMIT;
  const atTemplateLimit = templateCount >= FREE_TEMPLATE_LIMIT;

  return (
    <div className="rounded-xl border border-border/80 bg-background/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Your free plan
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatFreeTripUsage(tripCount)}
            <span className="mx-1.5 text-muted">·</span>
            {formatFreeTemplateUsage(templateCount)}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">
            {atTripLimit || atTemplateLimit
              ? "Upgrade to Pro for unlimited trips, saved checklists, and import."
              : "Full packing workflow included. Pro adds unlimited trips, lists, and import."}
          </p>
        </div>
        <button
          type="button"
          onClick={openPaywall}
          className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/90 to-teal-500/90 px-3 py-2 text-xs font-bold text-zinc-950 active:opacity-90"
        >
          <CampSyncMark className="size-3.5" aria-hidden />
          Pro
        </button>
      </div>
    </div>
  );
}
