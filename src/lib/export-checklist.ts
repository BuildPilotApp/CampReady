import {
  CHECKLIST_EXPORT_FORMAT,
  CHECKLIST_EXPORT_VERSION,
  tripToExportDocument,
} from "@/lib/checklist-export-format";
import { downloadTextFile } from "@/lib/download-text-file";
import { STATUS_LABELS } from "@/lib/gear-status";
import type { TripRecord } from "@/types";

const TEMPLATE_FILENAME_BASE = "campready-gear-inventory-template";

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
    `CampReady Pack List: ${trip.name}`,
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

  return lines.join("\n").trimEnd();
}

export function formatChecklistAsCsv(trip: TripRecord): string {
  const rows: string[][] = [
    ["Category", "Item", "Status", "Weight (lbs)", "Storage"],
  ];

  for (const category of trip.categories) {
    for (const item of category.items) {
      rows.push([
        category.name,
        item.name,
        STATUS_LABELS[item.status],
        item.weight_lbs != null ? String(item.weight_lbs) : "",
        item.storageLocation ?? "",
      ]);
    }
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function formatGearInventoryCsvTemplate(): string {
  return [["Category", "Item", "Status", "Weight (lbs)", "Storage"]]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

export function formatGearInventoryJsonTemplate(): string {
  return JSON.stringify(
    {
      version: CHECKLIST_EXPORT_VERSION,
      format: CHECKLIST_EXPORT_FORMAT,
      tripName: "Gear Inventory Template",
      exportedAt: new Date().toISOString(),
      instructions: [
        "Add categories before importing this file into CampReady.",
        "Each item status must be one of: missing, staged, packed.",
        "Weight is optional and should be a number in pounds.",
      ],
      categories: [],
    },
    null,
    2,
  );
}

export function formatChecklistAsJson(trip: TripRecord): string {
  return JSON.stringify(tripToExportDocument(trip), null, 2);
}

function tripHasExportableItems(trip: TripRecord): boolean {
  return trip.categories.some((category) => category.items.length > 0);
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

export async function downloadGearInventoryJsonTemplate(): Promise<boolean> {
  return downloadTextFile(
    formatGearInventoryJsonTemplate(),
    `${TEMPLATE_FILENAME_BASE}.json`,
    "application/json",
  );
}

export async function downloadChecklistAppBackup(trip: TripRecord): Promise<boolean> {
  const json = formatChecklistAsJson(trip);
  return downloadTextFile(
    json,
    `${sanitizeFilename(trip.name)}-app-backup.json`,
    "application/json",
  );
}

/** @deprecated Use downloadChecklistAppBackup */
export async function downloadChecklistJson(trip: TripRecord): Promise<boolean> {
  return downloadChecklistAppBackup(trip);
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
