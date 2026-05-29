"use client";

import { enumerateDateRange } from "@/lib/date-utils";
import { geocodeLocation, getWeatherSummariesForDates } from "@/lib/weather";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { MapPin, Wind } from "lucide-react";
import { useEffect, useState } from "react";

export function WeatherBanner() {
  const { activeTrip, updateTrip } = useCampReady();
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "needs-location"
  >("idle");
  const [daily, setDaily] = useState<{
    place: string;
    byDate: Record<
      string,
      { highF: number; lowF: number; windMph: number; label: string }
    >;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!activeTrip?.location?.query?.trim()) {
        setDaily(null);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setDaily(null);

      let latitude = activeTrip.location.latitude;
      let longitude = activeTrip.location.longitude;
      let place =
        activeTrip.location.resolvedName ?? activeTrip.location.query.trim();

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        const geo = await geocodeLocation(activeTrip.location.query);
        if (cancelled) return;
        if (!geo) {
          setStatus("needs-location");
          return;
        }
        latitude = geo.latitude;
        longitude = geo.longitude;
        place = geo.name;
        updateTrip(activeTrip.id, {
          location: {
            query: activeTrip.location.query.trim(),
            latitude: geo.latitude,
            longitude: geo.longitude,
            resolvedName: geo.name,
          },
        });
      }

      const datesIso = enumerateDateRange(
        activeTrip.startDate,
        activeTrip.endDate,
      );

      const weather = await getWeatherSummariesForDates({
        latitude: latitude!,
        longitude: longitude!,
        datesIso,
      });

      if (cancelled) return;

      const hasAny = datesIso.some((d) => weather[d] != null);
      if (!hasAny) {
        setStatus("error");
        return;
      }

      setDaily({ place, byDate: weather });
      setStatus("ready");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    activeTrip?.id,
    activeTrip?.startDate,
    activeTrip?.endDate,
    activeTrip?.location?.query,
    activeTrip?.location?.latitude,
    activeTrip?.location?.longitude,
    updateTrip,
  ]);

  if (!activeTrip?.location?.query?.trim()) {
    return (
      <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-background px-4 py-3">
        <p className="text-sm font-semibold text-muted">
          Add a location to your trip to see weather.
        </p>
      </div>
    );
  }

  const dates = enumerateDateRange(activeTrip.startDate, activeTrip.endDate);

  return (
    <div className="mt-4 rounded-xl border-2 border-border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Weather
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">
              {daily?.place ?? activeTrip.location.query}
            </span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
          {status === "loading"
            ? "Loading…"
            : status === "error"
              ? "Unavailable"
              : status === "needs-location"
                ? "No match"
                : "Daily"}
        </span>
      </div>

      {status === "needs-location" ? (
        <p className="mt-2 text-sm font-semibold text-muted">
          Select a location from suggestions or press Enter to match coordinates.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-2 text-sm font-semibold text-muted">
          Couldn’t load weather. Check the trip location spelling and try again.
        </p>
      ) : null}

      {status === "ready" || status === "loading" ? (
        <div className="mt-2 overflow-x-auto overscroll-x-contain">
          <div className="flex gap-2 pb-1">
            {dates.map((d) => {
              const s = daily?.byDate?.[d];
              const weekday = new Date(`${d}T12:00:00`).toLocaleDateString(
                undefined,
                { weekday: "short" },
              );
              const monthDay = new Date(`${d}T12:00:00`).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" },
              );

              return (
                <div
                  key={d}
                  className="flex w-20 flex-none flex-col items-center justify-center rounded-lg border-2 border-border bg-surface px-2 py-2"
                >
                  <p className="text-[0.65rem] font-bold leading-none text-muted">
                    {weekday}
                  </p>
                  <p className="text-[0.65rem] font-bold leading-none text-foreground">
                    {monthDay}
                  </p>
                  {s ? (
                    <>
                      <p className="mt-1 text-[0.8rem] font-extrabold tabular-nums text-foreground">
                        {s.highF}°/{s.lowF}°
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <Wind className="size-3 text-accent" aria-hidden />
                        <p className="text-[0.7rem] font-bold tabular-nums text-foreground">
                          {s.windMph}
                        </p>
                      </div>
                      <p className="mt-1 text-center text-[0.58rem] font-bold leading-tight text-accent">
                        {s.label}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[0.7rem] font-bold text-muted">
                      {status === "loading" ? "…" : "—"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
