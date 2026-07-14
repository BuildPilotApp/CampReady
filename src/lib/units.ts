export type AppUnits = "imperial" | "metric";

export const UNITS_STORAGE_KEY = "campready:units";

export function isAppUnits(value: string | null): value is AppUnits {
  return value === "imperial" || value === "metric";
}

export function getStoredUnits(): AppUnits {
  if (typeof window === "undefined") {
    return "imperial";
  }

  try {
    const stored = window.localStorage.getItem(UNITS_STORAGE_KEY);
    return isAppUnits(stored) ? stored : "imperial";
  } catch {
    return "imperial";
  }
}

export function storeUnits(units: AppUnits): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(UNITS_STORAGE_KEY, units);
  } catch {
    // Preference stays applied in memory for the current session.
  }
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

export function kgToLbs(kg: number): number {
  return kg / 0.45359237;
}

export function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function mphToKmh(mph: number): number {
  return mph / 0.621371;
}

export function weightUnitLabel(units: AppUnits): "lbs" | "kg" {
  return units === "metric" ? "kg" : "lbs";
}

/** Format a stored lbs value for display in the selected unit system. */
export function formatWeight(lbs: number, units: AppUnits): string {
  if (units === "metric") {
    return `${roundDisplay(lbsToKg(lbs), 1)} kg`;
  }
  return `${roundDisplay(lbs, 1)} lbs`;
}

/** Format a stored Fahrenheit value for display. */
export function formatTemp(f: number, units: AppUnits): string {
  if (units === "metric") {
    return `${Math.round(fToC(f))}°`;
  }
  return `${Math.round(f)}°`;
}

/** Format high/low stored Fahrenheit values for the weather strip. */
export function formatTempRange(
  highF: number,
  lowF: number,
  units: AppUnits,
): string {
  return `${formatTemp(highF, units)}/${formatTemp(lowF, units)}`;
}

/** Format a stored mph value for display. */
export function formatWind(mph: number, units: AppUnits): string {
  if (units === "metric") {
    return `${Math.round(mphToKmh(mph))}`;
  }
  return `${Math.round(mph)}`;
}

export function windUnitLabel(units: AppUnits): "mph" | "km/h" {
  return units === "metric" ? "km/h" : "mph";
}

/**
 * Convert a weight entered in the current display unit to stored lbs.
 * Returns undefined for empty/invalid input.
 */
export function displayWeightToLbs(
  value: string | number | null | undefined,
  units: AppUnits,
): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  if (numeric === 0) {
    return 0;
  }

  const lbs = units === "metric" ? kgToLbs(numeric) : numeric;
  return roundStored(lbs, 3);
}

/** Convert a stored lbs value to the number shown in a weight input. */
export function lbsToDisplayWeight(
  lbs: number | undefined,
  units: AppUnits,
): string {
  if (typeof lbs !== "number" || !Number.isFinite(lbs)) {
    return "";
  }

  if (units === "metric") {
    return formatNumberInput(lbsToKg(lbs));
  }
  return formatNumberInput(lbs);
}

function roundDisplay(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundStored(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatNumberInput(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const rounded = roundDisplay(value, 2);
  return String(rounded);
}
