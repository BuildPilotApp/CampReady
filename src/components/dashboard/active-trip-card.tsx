"use client";

import { ProgressRing } from "@/components/ui/progress-ring";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { WeatherBanner } from "@/components/weather/weather-banner";
import { CalendarDays, MapPin } from "lucide-react";

function formatTripDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ActiveTripCard() {
  const { activeTrip, activeTripStats } = useCampReady();

  if (!activeTrip) {
    return (
      <section className="rounded-2xl border-2 border-border bg-surface p-5">
        <p className="text-base font-semibold text-foreground">No active trip</p>
        <p className="mt-2 text-sm text-muted">
          Create a new trip below to start packing.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-accent/30 bg-surface p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-accent">
        Active trip
      </p>
      <h2 className="mt-1 text-2xl font-bold leading-tight text-foreground">
        {activeTrip.name}
      </h2>
      <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-muted">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-accent" aria-hidden />
          {activeTrip.startDate === activeTrip.endDate ? (
            formatTripDate(activeTrip.startDate)
          ) : (
            <>
              {formatTripDate(activeTrip.startDate)} -{" "}
              {formatTripDate(activeTrip.endDate)}
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
          Ready to roll
        </span>
      </div>

      <WeatherBanner />

      <div className="mt-5 flex items-center gap-5">
        <ProgressRing
          packed={activeTripStats?.packedItems ?? 0}
          total={activeTripStats?.totalItems ?? 0}
          size={128}
          strokeWidth={11}
        />
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-bold leading-none tabular-nums text-foreground">
            {activeTripStats?.packedItems ?? 0}
            <span className="text-xl font-semibold text-muted">
              {" "}
              / {activeTripStats?.totalItems ?? 0}
            </span>
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            items packed in vehicle
          </p>
          <p className="mt-3 text-sm leading-snug text-muted">
            Tap checklist rows to cycle Missing → Staged → Packed.
          </p>
        </div>
      </div>
    </section>
  );
}
