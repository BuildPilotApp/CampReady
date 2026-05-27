"use client";

import { geocodeLocation, getWeatherSummariesForDates } from "@/lib/weather";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { MapPin, Wind } from "lucide-react";
import { useEffect, useState } from "react";

export function WeatherBanner() {
  const { activeTrip, updateTrip } = useCampReady();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [daily, setDaily] = useState<
    | null
    | {
        place: string;
        byDate: Record<
          string,
          {
            highF: number;
            lowF: number;
            windMph: number;
            label: string;
          }
        >;
      }
  >(null);

  function enumerateDates(startIso: string, endIso: string): string[] {
    const start = new Date(`${startIso}T12:00:00`);
    const end = new Date(`${endIso}T12:00:00`);
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const out: string[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!activeTrip?.location?.query) {
        setDaily(null);
        setStatus("idle");
        return;
      }

      setStatus("loading");
      const geo =
        typeof activeTrip.location.latitude === "number" &&
        typeof activeTrip.location.longitude === "number"
          ? {
              name: activeTrip.location.resolvedName ?? activeTrip.location.query,
              latitude: activeTrip.location.latitude,
              longitude: activeTrip.location.longitude,
            }
          : await geocodeLocation(activeTrip.location.query);

      if (!geo) {
        if (!cancelled) setStatus("error");
        return;
      }

      // Persist resolved coordinates back onto the trip for reuse.
      if (
        typeof activeTrip.location.latitude !== "number" ||
        typeof activeTrip.location.longitude !== "number"
      ) {
        updateTrip(activeTrip.id, {
          location: {
            query: activeTrip.location.query,
            latitude: geo.latitude,
            longitude: geo.longitude,
            resolvedName: geo.name,
          },
        });
      }

      const datesIso = enumerateDates(activeTrip.startDate, activeTrip.endDate);
      const weather = await getWeatherSummariesForDates({
        latitude: geo.latitude,
        longitude: geo.longitude,
        datesIso,
      });

      if (cancelled) return;
      if (!weather) {
        setStatus("error");
        return;
      }

      setDaily({ place: geo.name, byDate: weather });
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
  ]);

  if (!activeTrip?.location?.query) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Weather
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-accent" aria-hidden />
            <span className="truncate">
              {daily?.place ?? activeTrip.location.query}
            </span>
          </p>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
          {status === "loading" ? "Loading…" : status === "error" ? "Unavailable" : "Daily"}
        </span>
      </div>

      <div className="mt-2 overflow-x-auto overscroll-x-contain">
        <div className="flex gap-2 pb-1">
          {enumerateDates(activeTrip.startDate, activeTrip.endDate).map((d) => {
            const s = daily?.byDate?.[d];
            const isLive = s?.label === "Live Forecast";
            const sourcePill = isLive
              ? "Live Forecast"
              : s?.label ?? "—";

            const weekday = new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "short",
            });
            const monthDay = new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

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
                    <p className="mt-1 text-[0.62rem] font-bold text-accent">
                      {sourcePill}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-[0.7rem] font-bold text-muted">…</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {status === "error" ? (
        <p className="mt-2 text-sm font-semibold text-muted">
          Couldn’t load weather. Check the trip location spelling.
        </p>
      ) : null}
    </div>
  );
}

