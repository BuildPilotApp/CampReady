"use client";

import type { TripRecord } from "@/types";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

function formatTripDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTripDates(trip: TripRecord): string {
  if (trip.startDate === trip.endDate) {
    return formatTripDate(trip.startDate);
  }
  return `${formatTripDate(trip.startDate)} – ${formatTripDate(trip.endDate)}`;
}

interface ApplyChecklistPromptProps {
  templateName: string;
  trips: TripRecord[];
  defaultTripId: string | null;
  onApply: (tripId: string) => void;
  onCancel: () => void;
  onEditOnly?: () => void;
}

export function ApplyChecklistPrompt({
  templateName,
  trips,
  defaultTripId,
  onApply,
  onEditOnly,
  onCancel,
}: ApplyChecklistPromptProps) {
  const [selectedTripId, setSelectedTripId] = useState(
    defaultTripId ?? trips[0]?.id ?? "",
  );

  useEffect(() => {
    setSelectedTripId(defaultTripId ?? trips[0]?.id ?? "");
  }, [defaultTripId, trips]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-4 sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-labelledby="apply-checklist-title"
        aria-modal="true"
        className="w-full max-w-[var(--mobile-max-width)] rounded-2xl border-2 border-border bg-surface p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="apply-checklist-title" className="text-lg font-bold text-foreground">
          Load checklist onto a trip?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Replace the gear list on the trip you choose with{" "}
          <span className="font-semibold text-foreground">&ldquo;{templateName}&rdquo;</span>
          . Current items and pack status on that trip will be reset.
        </p>

        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted">
            Choose trip
          </legend>
          <ul className="mt-2 flex flex-col gap-2">
            {trips.map((trip) => {
              const selected = selectedTripId === trip.id;
              return (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTripId(trip.id)}
                    aria-pressed={selected}
                    className={`touch-target flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left active:opacity-90 ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold text-foreground">
                        {trip.name}
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <CalendarDays className="size-3.5 shrink-0 text-accent" aria-hidden />
                        {formatTripDates(trip)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!selectedTripId}
            onClick={() => {
              if (selectedTripId) {
                onApply(selectedTripId);
              }
            }}
            className="touch-target rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load onto trip
          </button>
          {onEditOnly ? (
            <button
              type="button"
              onClick={onEditOnly}
              className="touch-target rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-bold text-foreground active:opacity-90"
            >
              Edit inventory only
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="touch-target rounded-xl px-4 py-2 text-sm font-semibold text-muted active:text-foreground"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
