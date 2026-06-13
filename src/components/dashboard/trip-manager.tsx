"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InventoryTemplatePicker } from "@/components/dashboard/inventory-template-picker";
import { ProgressRing } from "@/components/ui/progress-ring";
import { LocationInput, type LocationInputHandle } from "@/components/ui/location-input";
import { TripDateRangeInput } from "@/components/ui/trip-date-range-input";
import { WeatherBanner } from "@/components/weather/weather-banner";
import { FreePlanUsageCard } from "@/components/premium/free-plan-usage-card";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { todayIso } from "@/lib/date-utils";
import {
  NO_TRIPS_EMPTY_BODY,
  NO_TRIPS_EMPTY_TITLE,
} from "@/lib/gear-checklist-copy";
import { canCreateTrip } from "@/lib/pro";
import { getTripStats } from "@/lib/storage";
import { CUSTOM_TEMPLATE_ID, getTemplateOptionLabel } from "@/lib/templates";
import type { TripLocation, TripRecord } from "@/types";
import { CalendarDays, ChevronDown, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";

function formatTripDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sortTripsChronologically(trips: TripRecord[]): TripRecord[] {
  return [...trips].sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) {
      return byStart;
    }
    return a.endDate.localeCompare(b.endDate);
  });
}

function TripNameInput({ tripId, name }: { tripId: string; name: string }) {
  const { updateTrip } = useCampReady();
  const inputId = useId();
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [tripId]);

  const persistName = (raw: string) => {
    const next = raw.trim();
    if (next && next !== name) {
      updateTrip(tripId, { name: next });
    }
  };

  return (
    <label htmlFor={inputId} className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">
        Trip name
      </span>
      <input
        id={inputId}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          persistName(next);
        }}
        onBlur={() => {
          const next = value.trim();
          if (next) {
            persistName(value);
          } else {
            setValue(name);
          }
        }}
        className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
      />
    </label>
  );
}

function TripChecklistTemplateEditor({ tripId }: { tripId: string }) {
  const { database, applyChecklistTemplateToTrip } = useCampReady();
  const [templateId, setTemplateId] = useState<string>(CUSTOM_TEMPLATE_ID);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const templateName = getTemplateOptionLabel(templateId, database.templates ?? []);
  const confirmMessage =
    templateId === CUSTOM_TEMPLATE_ID
      ? "Clear this trip's gear checklist? All categories and items will be removed."
      : `Load "${templateName}" onto this trip? Current items and pack status will be replaced.`;

  return (
    <>
      <InventoryTemplatePicker
        templateId={templateId}
        onTemplateIdChange={setTemplateId}
        savedTemplates={database.templates ?? []}
        hint="Load a saved gear checklist from your inventory, or choose New to build as you pack."
        footer={
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="touch-target rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground active:opacity-90"
          >
            Apply gear checklist
          </button>
        }
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Apply gear checklist?"
        message={confirmMessage}
        confirmLabel="Apply"
        variant="default"
        onConfirm={() => {
          applyChecklistTemplateToTrip(tripId, templateId);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

export function TripManager() {
  const {
    database,
    activeTrip,
    selectTrip,
    createNewTrip,
    deleteTrip,
    updateTrip,
  } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>(todayIso());
  const [newLocation, setNewLocation] = useState<TripLocation | undefined>();
  const [templateId, setTemplateId] = useState<string>(CUSTOM_TEMPLATE_ID);
  const [tripPendingDelete, setTripPendingDelete] = useState<TripRecord | null>(null);
  const newTripNameId = useId();
  const newLocationRef = useRef<LocationInputHandle>(null);
  const createTripDetailsRef = useRef<HTMLDetailsElement>(null);

  const trips = useMemo(
    () => sortTripsChronologically(database.trips ?? []),
    [database.trips],
  );

  const tripLimitReached = !canCreateTrip(isPro, trips.length);

  const handleNewTripAttempt = (event: MouseEvent<HTMLElement>) => {
    if (!tripLimitReached) return;
    event.preventDefault();
    openPaywall();
  };

  const openCreateTripForm = () => {
    if (createTripDetailsRef.current) {
      createTripDetailsRef.current.open = true;
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Trips</h2>

      <FreePlanUsageCard />

      <details
        ref={createTripDetailsRef}
        className="rounded-xl border-2 border-border bg-surface p-4"
      >
        <summary
          onClick={handleNewTripAttempt}
          className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="size-5 text-accent" aria-hidden />
            Create new trip
          </span>
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <label htmlFor={newTripNameId} className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Trip name
            </span>
            <input
              id={newTripNameId}
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

          <LocationInput
            ref={newLocationRef}
            value={newLocation}
            onChange={setNewLocation}
          />

          <InventoryTemplatePicker
            templateId={templateId}
            onTemplateIdChange={setTemplateId}
            savedTemplates={database.templates ?? []}
            hint="Load a saved gear checklist from your inventory, or choose New to build as you pack."
          />

          <button
            type="button"
            disabled={!name.trim()}
            onClick={async () => {
              if (tripLimitReached) {
                openPaywall();
                return;
              }
              const location =
                (await newLocationRef.current?.commitQuery()) ?? newLocation;
              createNewTrip({
                name,
                startDate,
                endDate,
                location,
                templateId,
              });
              setName("");
              setStartDate(todayIso());
              setEndDate(todayIso());
              setNewLocation(undefined);
              setTemplateId(CUSTOM_TEMPLATE_ID);
            }}
            className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create trip
          </button>
        </div>
      </details>

      {trips.length === 0 ? (
        <section className="rounded-xl border-2 border-border bg-surface px-4 py-8 text-center">
          <p className="text-base font-semibold text-foreground">{NO_TRIPS_EMPTY_TITLE}</p>
          <p className="mt-2 text-sm leading-snug text-muted">{NO_TRIPS_EMPTY_BODY}</p>
          <button
            type="button"
            onClick={openCreateTripForm}
            className="touch-target mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground active:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            Create your first trip
          </button>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => {
            const selected = activeTrip?.id === trip.id;
            const stats = getTripStats(trip);

            return (
              <li
                key={trip.id}
                className={`overflow-hidden rounded-xl border-2 bg-surface ${
                  selected ? "border-accent/40 shadow-sm" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectTrip(trip.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left active:bg-background ${
                    selected ? "border-l-4 border-accent" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {selected ? (
                      <span className="text-xs font-bold uppercase tracking-widest text-accent">
                        Selected trip
                      </span>
                    ) : null}
                    <span
                      className={`block text-base font-bold text-foreground ${
                        selected ? "mt-1 text-xl" : ""
                      }`}
                    >
                      {trip.name}
                    </span>
                    <span className="mt-2 flex flex-col gap-1 text-xs font-semibold text-muted">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-4 text-accent" aria-hidden />
                        {trip.startDate === trip.endDate
                          ? formatTripDate(trip.startDate)
                          : `${formatTripDate(trip.startDate)} – ${formatTripDate(trip.endDate)}`}
                      </span>
                      {trip.location?.query ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="size-4 text-accent" aria-hidden />
                          {trip.location.resolvedName ?? trip.location.query}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  {selected ? (
                    <ProgressRing
                      packed={stats.packedItems}
                      total={stats.totalItems}
                      size={80}
                      strokeWidth={6}
                    />
                  ) : null}
                </button>

                {selected ? (
                  <div className="border-t border-border px-4 pb-4">
                    <WeatherBanner />
                    <div className="mt-4 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold leading-none tabular-nums text-foreground">
                          {stats.packedItems}
                          <span className="text-lg font-semibold text-muted">
                            {" "}
                            / {stats.totalItems}
                          </span>
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          items packed in vehicle
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

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
                      <TripNameInput tripId={trip.id} name={trip.name} />

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

                      <TripChecklistTemplateEditor tripId={trip.id} />
                    </div>
                  </details>

                  <div className="border-t border-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setTripPendingDelete(trip)}
                      className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
                    >
                      <Trash2 className="size-5 text-muted" aria-hidden />
                      Delete trip
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={tripPendingDelete !== null}
        title="Delete trip?"
        message={
          tripPendingDelete
            ? `This permanently removes "${tripPendingDelete.name}" and all of its packing data. This can't be undone.`
            : ""
        }
        confirmLabel="Delete trip"
        onConfirm={() => {
          if (tripPendingDelete) {
            deleteTrip(tripPendingDelete.id);
          }
          setTripPendingDelete(null);
        }}
        onCancel={() => setTripPendingDelete(null)}
      />
    </section>
  );
}
