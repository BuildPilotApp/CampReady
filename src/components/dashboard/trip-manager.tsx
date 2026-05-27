"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function todayIso(): string {
  const date = new Date();
  return date.toISOString().slice(0, 10);
}

export function TripManager() {
  const { database, activeTrip, selectTrip, createNewTrip, deleteTrip, updateTrip } =
    useCampReady();
  const [name, setName] = useState("");
  const [date, setDate] = useState<string>(todayIso());
  const [location, setLocation] = useState("");

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
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Location (for weather)
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
              placeholder="Yosemite"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              createNewTrip({
                name,
                date,
                locationQuery: location,
              });
              setName("");
              setLocation("");
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
                      {trip.date}
                    </span>
                    {trip.location?.query ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-4 text-accent" aria-hidden />
                        {trip.location.query}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>

              {selected ? (
                <div className="border-t border-border px-4 py-3">
                  <details>
                    <summary className="touch-target flex cursor-pointer list-none items-center justify-between font-bold text-foreground">
                      Edit trip details
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted">
                          Location
                        </span>
                        <input
                          value={trip.location?.query ?? ""}
                          onChange={(e) =>
                            updateTrip(trip.id, {
                              location: e.target.value.trim()
                                ? { query: e.target.value.trim() }
                                : undefined,
                            })
                          }
                          className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                          placeholder="Moab"
                        />
                      </label>
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

