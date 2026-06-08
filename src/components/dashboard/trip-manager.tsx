"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { LocationInput } from "@/components/ui/location-input";
import { TripDateRangeInput } from "@/components/ui/trip-date-range-input";
import { todayIso } from "@/lib/date-utils";
import {
  CUSTOM_TEMPLATE_ID,
  TRIP_CHECKLIST_OPTIONS,
  type TripChecklistTemplateId,
} from "@/lib/templates";
import type { TripLocation } from "@/types";
import { CalendarDays, ChevronDown, MapPin, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function TripManager() {
  const {
    database,
    activeTrip,
    selectTrip,
    createNewTrip,
    deleteTrip,
    updateTrip,
  } = useCampReady();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>(todayIso());
  const [newLocation, setNewLocation] = useState<TripLocation | undefined>();
  const [templateId, setTemplateId] = useState<TripChecklistTemplateId>(
    CUSTOM_TEMPLATE_ID,
  );

  const trips = useMemo(() => database.trips ?? [], [database.trips]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Trips</h2>

      <details className="rounded-xl border-2 border-border bg-surface p-4">
        <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-foreground">
          <span className="inline-flex items-center gap-2">
            <Plus className="size-5 text-accent" aria-hidden />
            Create new trip
          </span>
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Trip name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
              placeholder="Moab Spring Break"
            />
          </label>

          <TripDateRangeInput
            startDate={startDate}
            endDate={endDate}
            onChange={({ startDate: nextStart, endDate: nextEnd }) => {
              setStartDate(nextStart);
              setEndDate(nextEnd);
            }}
          />

          <LocationInput value={newLocation} onChange={setNewLocation} />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Checklist template
            </span>
            <div className="flex flex-col gap-2">
              {TRIP_CHECKLIST_OPTIONS.map((option) => {
                const selected = templateId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTemplateId(option.id)}
                    aria-pressed={selected}
                    className={`touch-target rounded-xl border-2 px-4 py-3 text-left active:opacity-90 ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <span className="block text-base font-bold text-foreground">
                      {option.name}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-muted">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              createNewTrip({
                name,
                startDate,
                endDate,
                location: newLocation,
                templateId,
              });
              setName("");
              setStartDate(todayIso());
              setEndDate(todayIso());
              setNewLocation(undefined);
              setTemplateId(CUSTOM_TEMPLATE_ID);
            }}
            className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90"
          >
            Create trip
          </button>
        </div>
      </details>

      <ul className="flex flex-col gap-3">
        {trips.map((trip) => {
          const selected = activeTrip?.id === trip.id;
          return (
            <li key={trip.id} className="rounded-xl border-2 border-border bg-surface">
              <button
                type="button"
                onClick={() => selectTrip(trip.id)}
                className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-background ${
                  selected ? "border-l-4 border-accent" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-foreground">
                    {trip.name}
                  </span>
                  <span className="mt-1 flex flex-col gap-1 text-xs font-semibold text-muted">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="size-4 text-accent" aria-hidden />
                      {trip.startDate === trip.endDate
                        ? trip.startDate
                        : `${trip.startDate} - ${trip.endDate}`}
                    </span>
                    {trip.location?.query ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-4 text-accent" aria-hidden />
                        {trip.location.resolvedName ?? trip.location.query}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>

              {selected ? (
                <div className="border-t border-border">
                  <details className="group">
                    <summary className="touch-target flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold text-foreground active:bg-background">
                      <span>Edit trip details</span>
                      <ChevronDown
                        className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="flex flex-col gap-3 px-4 pb-3">
                      <LocationInput
                        value={trip.location}
                        onChange={(location) =>
                          updateTrip(trip.id, { location })
                        }
                      />

                      <TripDateRangeInput
                        startDate={trip.startDate}
                        endDate={trip.endDate}
                        onChange={(range) => updateTrip(trip.id, range)}
                      />
                    </div>
                  </details>

                  <div className="border-t border-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this trip?")) {
                          deleteTrip(trip.id);
                        }
                      }}
                      className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
                    >
                      <Trash2 className="size-5 text-muted" aria-hidden />
                      Delete trip
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
