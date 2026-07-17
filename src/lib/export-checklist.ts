import { downloadTextFile } from "@/lib/download-text-file";
import { STATUS_LABELS } from "@/lib/gear-status";
import type { MealItemStatus, TripRecord } from "@/types";

const TEMPLATE_FILENAME_BASE = "campsync-gear-inventory-template";

export const MEAL_STATUS_LABELS: Record<MealItemStatus, string> = {
  available: "Available",
  consumed: "Consumed",
};

export const COMBINED_CSV_HEADERS = [
  "Type",
  "Category",
  "Item",
  "Status",
  "Weight (lbs)",
  "Storage",
  "Day",
  "Recipe Notes",
] as const;

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "trip";
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTripDates(trip: TripRecord): string {
  if (trip.startDate === trip.endDate) {
    return trip.startDate;
  }
  return `${trip.startDate} – ${trip.endDate}`;
}

export function formatChecklistAsText(trip: TripRecord): string {
  const lines: string[] = [
    `CampSync Pack List: ${trip.name}`,
    `Dates: ${formatTripDates(trip)}`,
    "",
  ];

  for (const category of trip.categories) {
    lines.push(`${category.name}`);
    lines.push("─".repeat(Math.min(category.name.length, 40)));

    if (category.items.length === 0) {
      lines.push("  (no items)");
    } else {
      for (const item of category.items) {
        const weight =
          item.weight_lbs != null ? ` · ${item.weight_lbs} lbs` : "";
        const storage = item.storageLocation
          ? ` · ${item.storageLocation}`
          : "";
        lines.push(
          `  [${STATUS_LABELS[item.status]}] ${item.name}${weight}${storage}`,
        );
      }
    }

    lines.push("");
  }

  const mealDays = [...(trip.mealPrepDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
  const hasMeals = mealDays.some((day) => day.items.length > 0);

  if (hasMeals) {
    lines.push("Meal Prep");
    lines.push("─".repeat(9));

    for (const day of mealDays) {
      if (day.items.length === 0) continue;
      lines.push(`Day ${day.dayNumber}`);
      for (const item of day.items) {
        const notes = item.recipeNotes ? ` · ${item.recipeNotes}` : "";
        lines.push(
          `  [${MEAL_STATUS_LABELS[item.status]}] ${item.title}${notes}`,
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

export function formatChecklistAsCsv(trip: TripRecord): string {
  const rows: string[][] = [[...COMBINED_CSV_HEADERS]];

  for (const category of trip.categories) {
    for (const item of category.items) {
      rows.push([
        "Gear",
        category.name,
        item.name,
        STATUS_LABELS[item.status],
        item.weight_lbs != null ? String(item.weight_lbs) : "",
        item.storageLocation ?? "",
        "",
        "",
      ]);
    }
  }

  const mealDays = [...(trip.mealPrepDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );

  for (const day of mealDays) {
    for (const item of day.items) {
      rows.push([
        "Meal",
        "",
        item.title,
        MEAL_STATUS_LABELS[item.status],
        "",
        "",
        String(day.dayNumber),
        item.recipeNotes ?? "",
      ]);
    }
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function formatGearInventoryCsvTemplate(): string {
  return [[...COMBINED_CSV_HEADERS]]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function tripHasExportableItems(trip: TripRecord): boolean {
  const hasGear = trip.categories.some((category) => category.items.length > 0);
  const hasMeals = (trip.mealPrepDays ?? []).some((day) => day.items.length > 0);
  return hasGear || hasMeals;
}

export async function downloadChecklistCsv(trip: TripRecord): Promise<boolean> {
  if (!tripHasExportableItems(trip)) {
    window.alert("Add items to your list before exporting!");
    return false;
  }

  const csv = formatChecklistAsCsv(trip);
  return downloadTextFile(
    csv,
    `${sanitizeFilename(trip.name)}-pack-list.csv`,
    "text/csv",
  );
}

export async function downloadGearInventoryCsvTemplate(): Promise<boolean> {
  return downloadTextFile(
    formatGearInventoryCsvTemplate(),
    `${TEMPLATE_FILENAME_BASE}.csv`,
    "text/csv",
  );
}

export async function copyChecklistText(trip: TripRecord): Promise<void> {
  const text = formatChecklistAsText(trip);

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the execCommand fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
