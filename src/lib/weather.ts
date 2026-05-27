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

export async function getWeatherSummary(input: {
  latitude: number;
  longitude: number;
  dateIso: string;
}): Promise<WeatherSummary | null> {
  const { latitude, longitude, dateIso } = input;
  const within10 = daysUntil(dateIso) <= 10;
  const key = cacheKey([
    within10 ? "forecast" : "archive",
    String(latitude),
    String(longitude),
    dateIso,
  ]);

  const cached = readCache<WeatherSummary>(key, 1000 * 60 * 30);
  if (cached) return cached;

  const url = new URL(within10 ? FORECAST_ENDPOINT : ARCHIVE_ENDPOINT);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,windspeed_10m_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");

  if (within10) {
    url.searchParams.set("start_date", dateIso);
    url.searchParams.set("end_date", dateIso);
  } else {
    const [y, m, d] = dateIso.split("-").map((v) => Number(v));
    const year = (y ?? 0) - 1;
    const prior = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    url.searchParams.set("start_date", prior);
    url.searchParams.set("end_date", prior);
  }

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const daily = data?.daily;
  const maxC = daily?.temperature_2m_max?.[0];
  const minC = daily?.temperature_2m_min?.[0];
  const windKmh = daily?.windspeed_10m_max?.[0];
  if (
    typeof maxC !== "number" ||
    typeof minC !== "number" ||
    typeof windKmh !== "number"
  ) {
    return null;
  }

  const summary: WeatherSummary = {
    highF: Math.round(toF(maxC)),
    lowF: Math.round(toF(minC)),
    windMph: Math.round(toMph(windKmh)),
    label: within10 ? "Live Forecast" : `Historical Average (${new Date().getFullYear() - 1})`,
  };
  writeCache(key, summary);
  return summary;
}

