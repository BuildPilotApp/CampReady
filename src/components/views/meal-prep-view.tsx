"use client";

import { MealDaySection } from "@/components/meal-prep/meal-day-section";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { getVisibleMealPrepDays } from "@/lib/meal-prep";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import { LayoutDashboard, Lock, UtensilsCrossed } from "lucide-react";

export function MealPrepView() {
  const { activeTrip, setActiveTab } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const locked = !isPro && !isPrimeTestLabBypassActive();

  if (!activeTrip) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <div className="rounded-xl border border-border bg-surface px-4 py-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <UtensilsCrossed className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground">Meal Prep</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Select a trip on the Dashboard to plan meals by day.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="touch-target mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground active:opacity-90"
              >
                <LayoutDashboard className="size-4" strokeWidth={2.5} aria-hidden />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <div className="rounded-xl border border-border bg-surface px-4 py-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Lock className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground">
                Meal Prep is a Pro feature
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Plan food by trip day, track what&apos;s consumed, and keep
                recipe notes handy at camp with CampSync Pro.
              </p>
              <button
                type="button"
                onClick={openPaywall}
                className="touch-target mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500/90 to-teal-500/90 px-4 py-3 text-sm font-bold text-zinc-950 active:opacity-90"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const days = getVisibleMealPrepDays(activeTrip);

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="px-0.5 pb-1">
        <h2 className="text-lg font-bold text-foreground">Meal Prep</h2>
        <p className="mt-0.5 text-sm text-muted">
          {activeTrip.name} · {days.length} day{days.length === 1 ? "" : "s"}
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-5">
          <p className="text-sm leading-relaxed text-muted">
            Set a valid start and end date on this trip to generate meal days.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="touch-target mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground active:opacity-90"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Edit trip dates
          </button>
        </div>
      ) : (
        days.map((day) => <MealDaySection key={day.dayNumber} day={day} />)
      )}
    </div>
  );
}
