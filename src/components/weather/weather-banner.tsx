"use client";

import { geocodeLocation, getWeatherSummary } from "@/lib/weather";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { CloudSun, MapPin, Wind } from "lucide-react";
import { useEffect, useState } from "react";

export function WeatherBanner() {
  const { activeTrip, updateTrip } = useCampReady();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [summary, setSummary] = useState<{
    highF: number;
    lowF: number;
    windMph: number;
    label: string;
    place: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!activeTrip?.location?.query) {
        setSummary(null);
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

      const weather = await getWeatherSummary({
        latitude: geo.latitude,
        longitude: geo.longitude,
        dateIso: activeTrip.date,
      });

      if (cancelled) return;
      if (!weather) {
        setStatus("error");
        return;
      }

      setSummary({ ...weather, place: geo.name });
      setStatus("ready");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [activeTrip?.id, activeTrip?.date, activeTrip?.location?.query]);

  if (!activeTrip?.location?.query) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Weather
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="size-4 text-accent" aria-hidden />
            <span className="truncate">{summary?.place ?? activeTrip.location.query}</span>
          </p>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
          {summary?.label ?? (status === "loading" ? "Loading…" : "Unavailable")}
        </span>
      </div>

      {summary ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CloudSun className="size-5 text-accent" aria-hidden />
            <p className="text-sm font-bold text-foreground">
              {summary.highF}° / {summary.lowF}°
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="size-5 text-accent" aria-hidden />
            <p className="text-sm font-bold text-foreground">
              {summary.windMph} mph
            </p>
          </div>
        </div>
      ) : status === "error" ? (
        <p className="mt-3 text-sm font-semibold text-muted">
          Couldn’t load weather. Check the trip location spelling.
        </p>
      ) : null}
    </div>
  );
}

