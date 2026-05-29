"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { LocationInput } from "@/components/ui/location-input";
import { todayIso } from "@/lib/date-utils";
import type { TripLocation } from "@/types";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
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

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const next = e.target.value;
                setStartDate(next);
                setEndDate((current) => (current < next ? next : current));
              }}
              className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              End date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const next = e.target.value;
                setEndDate(next);
                setStartDate((current) => (current > next ? next : current));
              }}
              className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
            />
          </label>

          <LocationInput value={newLocation} onChange={setNewLocation} />

          <button
            type="button"
            onClick={() => {
              createNewTrip({
                name,
                startDate,
                endDate,
                location: newLocation,
              });
              setName("");
              setStartDate(todayIso());
              setEndDate(todayIso());
              setNewLocation(undefined);
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
                <div className="border-t border-border px-4 py-3">
                  <details open>
                    <summary className="touch-target flex cursor-pointer list-none items-center justify-between font-bold text-foreground">
                      Edit trip details
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      <LocationInput
                        value={trip.location}
                        onChange={(location) =>
                          updateTrip(trip.id, { location })
                        }
                      />

                      <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                            Start
                          </span>
                          <input
                            type="date"
                            value={trip.startDate}
                            onChange={(e) => {
                              const next = e.target.value;
                              updateTrip(trip.id, {
                                startDate: next,
                                endDate:
                                  trip.endDate < next ? next : trip.endDate,
                              });
                            }}
                            className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                            End
                          </span>
                          <input
                            type="date"
                            value={trip.endDate}
                            onChange={(e) => {
                              const next = e.target.value;
                              updateTrip(trip.id, {
                                endDate: next,
                                startDate:
                                  trip.startDate > next ? next : trip.startDate,
                              });
                            }}
                            className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                          />
                        </label>
                      </div>
                    </div>
                  </details>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this trip?")) {
                        deleteTrip(trip.id);
                      }
                    }}
                    className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
                  >
                    <Trash2 className="size-5 text-muted" aria-hidden />
                    Delete trip
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
