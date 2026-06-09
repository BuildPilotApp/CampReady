import { formatLocalIsoDate, parseIsoDate } from "@/lib/date-utils";

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

export interface WeatherFetchResult {
  summaries: Record<string, WeatherSummary>;
  offline: boolean;
}

interface StoredForecastSnapshot {
  latitude: number;
  longitude: number;
  datesIso: string[];
  summaries: Record<string, WeatherSummary>;
}

const LAST_FORECAST_KEY = "campready:weather:last-forecast";

const GEOCODE_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";

const DAILY_PARAMS =
  "temperature_2m_max,temperature_2m_min,wind_speed_10m_max";

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

function readPersistentCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { ts: number; value: T };
    return parsed.value;
  } catch {
    return null;
  }
}

function writePersistentCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }));
}

function writeLastForecastSnapshot(snapshot: StoredForecastSnapshot): void {
  writePersistentCache(LAST_FORECAST_KEY, snapshot);
}

function readLastForecastSnapshot(): StoredForecastSnapshot | null {
  return readPersistentCache<StoredForecastSnapshot>(LAST_FORECAST_KEY);
}

function mergeOfflineForecast(
  results: Record<string, WeatherSummary>,
  datesIso: string[],
  latitude: number,
  longitude: number,
): { summaries: Record<string, WeatherSummary>; usedOffline: boolean } {
  const stored = readLastForecastSnapshot();
  if (!stored) {
    return { summaries: results, usedOffline: false };
  }

  const locationMatches =
    stored.latitude === latitude && stored.longitude === longitude;
  const merged = { ...results };
  let usedOffline = false;

  for (const dateIso of datesIso) {
    if (merged[dateIso]) {
      continue;
    }
    if (locationMatches && stored.summaries[dateIso]) {
      merged[dateIso] = stored.summaries[dateIso];
      usedOffline = true;
      continue;
    }
    if (stored.summaries[dateIso]) {
      merged[dateIso] = stored.summaries[dateIso];
      usedOffline = true;
    }
  }

  return { summaries: merged, usedOffline };
}

function mapGeocodeResult(first: {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}): GeocodeResult {
  return {
    name: [first.name, first.admin1, first.country].filter(Boolean).join(", "),
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const results = await searchGeocodeLocations(query, 1);
  return results[0] ?? null;
}

export async function searchGeocodeLocations(
  query: string,
  count = 5,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = cacheKey(["geocode-search", q.toLowerCase(), String(count)]);
  const cached = readCache<GeocodeResult[]>(key, 1000 * 60 * 60 * 24 * 7);
  if (cached) return cached;

  try {
    const url = new URL(GEOCODE_ENDPOINT);
    url.searchParams.set("name", q);
    url.searchParams.set("count", String(count));
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const results = (data.results ?? []).map(mapGeocodeResult);
    writeCache(key, results);
    return results;
  } catch {
    return [];
  }
}

function daysUntil(dateIso: string): number {
  const today = parseIsoDate(formatLocalIsoDate(new Date()));
  const target = parseIsoDate(dateIso);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function parseDailyResponse(
  data: unknown,
): Map<string, { maxC: number; minC: number; windKmh: number }> {
  const daily = (data as { daily?: Record<string, unknown> })?.daily;
  const times = Array.isArray(daily?.time) ? (daily.time as string[]) : [];
  const maxArr = Array.isArray(daily?.temperature_2m_max)
    ? (daily.temperature_2m_max as number[])
    : [];
  const minArr = Array.isArray(daily?.temperature_2m_min)
    ? (daily.temperature_2m_min as number[])
    : [];
  const windArr = Array.isArray(daily?.wind_speed_10m_max)
    ? (daily.wind_speed_10m_max as number[])
    : Array.isArray(daily?.windspeed_10m_max)
      ? (daily.windspeed_10m_max as number[])
      : [];

  const map = new Map<string, { maxC: number; minC: number; windKmh: number }>();
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const maxC = maxArr[i];
    const minC = minArr[i];
    const windRaw = windArr[i];
    if (
      typeof t === "string" &&
      typeof maxC === "number" &&
      typeof minC === "number"
    ) {
      map.set(t, {
        maxC,
        minC,
        windKmh: typeof windRaw === "number" ? windRaw : 0,
      });
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

/** Live forecast for today through the next 10 days. */
function isLiveForecastDate(dateIso: string): boolean {
  const diffDays = daysUntil(dateIso);
  return diffDays >= 0 && diffDays <= 10;
}

async function fetchDailyRange(input: {
  endpoint: string;
  latitude: number;
  longitude: number;
  startIso: string;
  endIso: string;
}): Promise<{
  data: Map<string, { maxC: number; minC: number; windKmh: number }> | null;
  networkError: boolean;
}> {
  const { endpoint, latitude, longitude, startIso, endIso } = input;

  try {
    const url = new URL(endpoint);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("daily", DAILY_PARAMS);
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("start_date", startIso);
    url.searchParams.set("end_date", endIso);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return { data: null, networkError: true };
    }
    const json = await res.json();
    return { data: parseDailyResponse(json), networkError: false };
  } catch {
    return { data: null, networkError: true };
  }
}

export async function getWeatherSummariesForDates(input: {
  latitude: number;
  longitude: number;
  datesIso: string[];
}): Promise<WeatherFetchResult> {
  const { latitude, longitude, datesIso } = input;
  const uniqueDates = sortIsoAsc(Array.from(new Set(datesIso)));
  if (uniqueDates.length === 0) {
    return { summaries: {}, offline: false };
  }

  const results: Record<string, WeatherSummary> = {};
  let networkError = false;

  const forecastDates: string[] = [];
  const archiveDates: string[] = [];

  for (const d of uniqueDates) {
    if (isLiveForecastDate(d)) forecastDates.push(d);
    else archiveDates.push(d);
  }

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

  const applyToResults = (
    dateIso: string,
    maxC: number,
    minC: number,
    windKmh: number,
  ) => {
    const summary: WeatherSummary = {
      highF: Math.round(toF(maxC)),
      lowF: Math.round(toF(minC)),
      windMph: Math.round(toMph(windKmh)),
      label: isLiveForecastDate(dateIso)
        ? "Live Forecast"
        : `Historical Avg (${isoDatePrevYear(dateIso).slice(0, 4)})`,
    };
    results[dateIso] = summary;
    return summary;
  };

  if (missingForecast.length > 0) {
    const startIso = missingForecast[0]!;
    const endIso = missingForecast[missingForecast.length - 1]!;
    const { data: dailyMap, networkError: forecastFailed } = await fetchDailyRange({
      endpoint: FORECAST_ENDPOINT,
      latitude,
      longitude,
      startIso,
      endIso,
    });

    if (forecastFailed) {
      networkError = true;
    }

    if (dailyMap) {
      for (const d of missingForecast) {
        const row = dailyMap.get(d);
        if (!row) continue;
        const key = cacheKey(["forecast", String(latitude), String(longitude), d]);
        const summary = applyToResults(d, row.maxC, row.minC, row.windKmh);
        writeCache(key, summary);
      }
    }
  }

  if (missingArchive.length > 0) {
    const priorDates = sortIsoAsc(missingArchive.map(isoDatePrevYear));
    const startIso = priorDates[0]!;
    const endIso = priorDates[priorDates.length - 1]!;

    const { data: dailyMap, networkError: archiveFailed } = await fetchDailyRange({
      endpoint: ARCHIVE_ENDPOINT,
      latitude,
      longitude,
      startIso,
      endIso,
    });

    if (archiveFailed) {
      networkError = true;
    }

    if (dailyMap) {
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
  }

  const missingAfterFetch = uniqueDates.filter((dateIso) => results[dateIso] == null);
  const hasFreshData = uniqueDates.some((dateIso) => results[dateIso] != null);

  if (hasFreshData && missingAfterFetch.length === 0 && !networkError) {
    writeLastForecastSnapshot({
      latitude,
      longitude,
      datesIso: uniqueDates,
      summaries: results,
    });
    return { summaries: results, offline: false };
  }

  if (networkError || missingAfterFetch.length > 0) {
    const { summaries: merged, usedOffline } = mergeOfflineForecast(
      results,
      uniqueDates,
      latitude,
      longitude,
    );
    if (usedOffline && uniqueDates.some((dateIso) => merged[dateIso] != null)) {
      return { summaries: merged, offline: true };
    }
    if (Object.keys(merged).length > 0) {
      return { summaries: merged, offline: usedOffline };
    }
  }

  return { summaries: results, offline: false };
}
