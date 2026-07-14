"use client";

import { enumerateDateRange } from "@/lib/date-utils";
import { onReturnToForeground } from "@/lib/runtime/app-power-mode";
import { shouldAttemptNetworkFetch } from "@/lib/runtime/network-guard";
import {
  formatTempRange,
  formatWind,
  windUnitLabel,
} from "@/lib/units";
import {
  geocodeLocation,
  getWeatherSummariesForDates,
  loadCachedWeatherOnly,
} from "@/lib/weather";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { useUnits } from "@/components/providers/units-provider";
import { useAppPowerMode } from "@/hooks/use-app-power-mode";
import { MapPin, Wind } from "lucide-react";
import { useEffect, useState } from "react";

function WeatherStatusBadge({
  status,
}: {
  status: "idle" | "loading" | "ready" | "offline" | "error" | "needs-location";
}) {
  if (status === "loading") {
    return (
      <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent sm:px-3">
        Loading…
      </span>
    );
  }

  if (status === "offline") {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-200 sm:px-3">
        <span className="sm:hidden">Cached</span>
        <span className="hidden sm:inline">Offline (Cached)</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent sm:px-3">
        Unavailable
      </span>
    );
  }

  if (status === "needs-location") {
    return (
      <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent sm:px-3">
        No match
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent sm:px-3">
      Daily
    </span>
  );
}

interface WeatherBannerProps {
  onAddLocation?: () => void;
}

export function WeatherBanner({ onAddLocation }: WeatherBannerProps) {
  const { activeTrip, updateTrip } = useCampReady();
  const { units } = useUnits();
  const { deferNetwork } = useAppPowerMode();
  const windLabel = windUnitLabel(units);
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "offline" | "error" | "needs-location"
  >("idle");
  const [daily, setDaily] = useState<{
    place: string;
    byDate: Record<
      string,
      { highF: number; lowF: number; windMph: number; label: string }
    >;
  } | null>(null);

  useEffect(() => onReturnToForeground(() => setRefreshKey((key) => key + 1)), []);

  useEffect(() => {
    if (deferNetwork) {
      return;
    }

    let cancelled = false;

    async function run() {
      if (!activeTrip?.location?.query?.trim()) {
        setDaily(null);
        setStatus("idle");
        return;
      }

      const datesIso = enumerateDateRange(
        activeTrip.startDate,
        activeTrip.endDate,
      );

      let latitude = activeTrip.location.latitude;
      let longitude = activeTrip.location.longitude;
      let place =
        activeTrip.location.resolvedName ?? activeTrip.location.query.trim();

      const applyCachedOnly = () => {
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          setDaily(null);
          setStatus("needs-location");
          return;
        }

        const cached = loadCachedWeatherOnly({
          latitude,
          longitude,
          datesIso,
        });
        const hasAny = datesIso.some((d) => cached.summaries[d] != null);
        if (!hasAny) {
          setDaily(null);
          setStatus("error");
          return;
        }

        setDaily({ place, byDate: cached.summaries });
        setStatus("offline");
      };

      if (!shouldAttemptNetworkFetch()) {
        applyCachedOnly();
        return;
      }

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        const geo = await geocodeLocation(activeTrip.location.query);
        if (cancelled) return;
        if (!geo) {
          applyCachedOnly();
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

      setStatus("loading");

      const { summaries: weather, offline } = await getWeatherSummariesForDates({
        latitude: latitude!,
        longitude: longitude!,
        datesIso,
      });

      if (cancelled) return;

      const hasAny = datesIso.some((d) => weather[d] != null);
      if (!hasAny) {
        applyCachedOnly();
        return;
      }

      setDaily({ place, byDate: weather });
      setStatus(offline ? "offline" : "ready");
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
    activeTrip?.location?.resolvedName,
    updateTrip,
    deferNetwork,
    refreshKey,
  ]);

  if (!activeTrip?.location?.query?.trim()) {
    return (
      <button
        type="button"
        onClick={onAddLocation}
        className="mt-4 w-full rounded-xl border-2 border-dashed border-border bg-background px-4 py-3 text-left active:bg-surface"
      >
        <p className="text-sm font-semibold text-muted">
          Add a location to your trip to see weather.
        </p>
      </button>
    );
  }

  const dates = enumerateDateRange(activeTrip.startDate, activeTrip.endDate);

  return (
    <div className="mt-4 rounded-xl border-2 border-border bg-background px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0 flex-1">
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
        {status !== "idle" ? <WeatherStatusBadge status={status} /> : null}
      </div>

      {status === "needs-location" ? (
        <p className="mt-2 text-sm font-semibold text-muted">
          Select a location from suggestions or press Enter to match coordinates.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-2 text-sm font-semibold text-muted">
          Couldn&apos;t load weather. Check the trip location spelling and try again.
        </p>
      ) : null}

      {status === "ready" || status === "offline" || status === "loading" ? (
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
                  <p className="text-xs font-bold leading-none text-muted">
                    {weekday}
                  </p>
                  <p className="text-xs font-bold leading-none text-foreground">
                    {monthDay}
                  </p>
                  {s ? (
                    <>
                      <p className="mt-1 text-sm font-extrabold tabular-nums text-foreground">
                        {formatTempRange(s.highF, s.lowF, units)}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <Wind className="size-3 text-accent" aria-hidden />
                        <p
                          className="text-xs font-bold tabular-nums text-foreground"
                          aria-label={`Wind ${formatWind(s.windMph, units)} ${windLabel}`}
                        >
                          {formatWind(s.windMph, units)}
                        </p>
                      </div>
                      <p className="mt-1 text-center text-xs font-bold leading-tight text-accent">
                        {status === "offline" ? "Cached" : s.label}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs font-bold text-muted">
                      {status === "loading" ? "…" : "N/A"}
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
