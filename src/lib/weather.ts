export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WeatherSummary {
  highF: number;
  lowF: number;
  windMph: number;
  label: string;
}

const GEOCODE_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";

function toF(c: number): number {
  return (c * 9) / 5 + 32;
}

function toMph(kmh: number): number {
  return kmh * 0.621371;
}

function cacheKey(parts: string[]): string {
  return `campready:weather:${parts.join(":")}`;
}

function readCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { ts: number; value: T };
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }));
}

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const key = cacheKey(["geocode", q.toLowerCase()]);
  const cached = readCache<GeocodeResult>(key, 1000 * 60 * 60 * 24 * 30);
  if (cached) return cached;

  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const first = data?.results?.[0];
  if (!first) return null;

  const result: GeocodeResult = {
    name: [first.name, first.admin1, first.country].filter(Boolean).join(", "),
    latitude: first.latitude,
    longitude: first.longitude,
  };
  writeCache(key, result);
  return result;
}

function daysUntil(dateIso: string): number {
  const start = new Date();
  const target = new Date(`${dateIso}T12:00:00`);
  const diff = target.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function parseDailyResponse(data: any): Map<string, { maxC: number; minC: number; windKmh: number }> {
  const daily = data?.daily;
  const times: string[] = Array.isArray(daily?.time) ? daily.time : [];
  const maxArr: number[] = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max : [];
  const minArr: number[] = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min : [];
  const windArr: number[] = Array.isArray(daily?.windspeed_10m_max) ? daily.windspeed_10m_max : [];

  const map = new Map<string, { maxC: number; minC: number; windKmh: number }>();
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const maxC = maxArr[i];
    const minC = minArr[i];
    const windKmh = windArr[i];
    if (typeof t === "string" && typeof maxC === "number" && typeof minC === "number" && typeof windKmh === "number") {
      map.set(t, { maxC, minC, windKmh });
    }
  }
  return map;
}

function isoDatePrevYear(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map((v) => Number(v));
  const year = (y ?? 0) - 1;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function sortIsoAsc(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

function isWithinNext10(dateIso: string): boolean {
  const diffDays = daysUntil(dateIso);
  return diffDays >= 0 && diffDays <= 10;
}

async function fetchDailyRange(input: {
  endpoint: string;
  latitude: number;
  longitude: number;
  startIso: string;
  endIso: string;
}): Promise<Map<string, { maxC: number; minC: number; windKmh: number }> | null> {
  const { endpoint, latitude, longitude, startIso, endIso } = input;
  const url = new URL(endpoint);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,windspeed_10m_max",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("start_date", startIso);
  url.searchParams.set("end_date", endIso);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return parseDailyResponse(data);
}

export async function getWeatherSummariesForDates(input: {
  latitude: number;
  longitude: number;
  datesIso: string[];
}): Promise<Record<string, WeatherSummary> | null> {
  const { latitude, longitude, datesIso } = input;
  const uniqueDates = sortIsoAsc(Array.from(new Set(datesIso)));
  if (uniqueDates.length === 0) return {};

  const results: Record<string, WeatherSummary> = {};

  const forecastDates: string[] = [];
  const archiveDates: string[] = [];

  for (const d of uniqueDates) {
    if (isWithinNext10(d)) forecastDates.push(d);
    else archiveDates.push(d);
  }

  // 1) Fill from cache when possible; collect the missing subsets.
  const missingForecast: string[] = [];
  const missingArchive: string[] = [];

  for (const d of forecastDates) {
    const key = cacheKey(["forecast", String(latitude), String(longitude), d]);
    const cached = readCache<WeatherSummary>(key, 1000 * 60 * 30);
    if (cached) results[d] = cached;
    else missingForecast.push(d);
  }

  for (const d of archiveDates) {
    const prev = isoDatePrevYear(d);
    const key = cacheKey(["archive", String(latitude), String(longitude), d, prev]);
    const cached = readCache<WeatherSummary>(key, 1000 * 60 * 30);
    if (cached) results[d] = cached;
    else missingArchive.push(d);
  }

  const applyToResults = (dateIso: string, maxC: number, minC: number, windKmh: number) => {
    const summary: WeatherSummary = {
      highF: Math.round(toF(maxC)),
      lowF: Math.round(toF(minC)),
      windMph: Math.round(toMph(windKmh)),
      label: isWithinNext10(dateIso)
        ? "Live Forecast"
        : `Historical Average (${new Date(isoDatePrevYear(dateIso)).getFullYear()})`,
    };
    results[dateIso] = summary;
    return summary;
  };

  // 2) Fetch forecast range for missing forecast dates.
  if (missingForecast.length > 0) {
    const startIso = missingForecast[0];
    const endIso = missingForecast[missingForecast.length - 1];
    const dailyMap = await fetchDailyRange({
      endpoint: FORECAST_ENDPOINT,
      latitude,
      longitude,
      startIso,
      endIso,
    });

    if (!dailyMap) return null;

    for (const d of missingForecast) {
      const row = dailyMap.get(d);
      if (!row) continue;
      const key = cacheKey(["forecast", String(latitude), String(longitude), d]);
      const summary = applyToResults(d, row.maxC, row.minC, row.windKmh);
      writeCache(key, summary);
    }
  }

  // 3) Fetch archive range for missing archive dates (previous-year equivalents).
  if (missingArchive.length > 0) {
    const priorDates = sortIsoAsc(missingArchive.map(isoDatePrevYear));
    const startIso = priorDates[0];
    const endIso = priorDates[priorDates.length - 1];

    const dailyMap = await fetchDailyRange({
      endpoint: ARCHIVE_ENDPOINT,
      latitude,
      longitude,
      startIso,
      endIso,
    });

    if (!dailyMap) return null;

    for (const d of missingArchive) {
      const priorIso = isoDatePrevYear(d);
      const row = dailyMap.get(priorIso);
      if (!row) continue;
      const key = cacheKey([
        "archive",
        String(latitude),
        String(longitude),
        d,
        priorIso,
      ]);
      const summary = applyToResults(d, row.maxC, row.minC, row.windKmh);
      writeCache(key, summary);
    }
  }

  return results;
}

