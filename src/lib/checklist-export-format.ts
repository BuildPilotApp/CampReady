import type { GearItemStatus, TripRecord } from "@/types";

/** Current checklist export format written by CampSync. */
export const CHECKLIST_EXPORT_FORMAT = "campsync-checklist" as const;
/** Legacy CampReady checklist exports still accepted on import. */
export const LEGACY_CHECKLIST_EXPORT_FORMAT = "campready-checklist" as const;
export const CHECKLIST_EXPORT_VERSION = 1 as const;

const ACCEPTED_CHECKLIST_FORMATS = new Set<string>([
  CHECKLIST_EXPORT_FORMAT,
  LEGACY_CHECKLIST_EXPORT_FORMAT,
]);

export function isAcceptedChecklistExportFormat(format: unknown): boolean {
  return typeof format === "string" && ACCEPTED_CHECKLIST_FORMATS.has(format);
}

export interface ChecklistExportItem {
  name: string;
  status: GearItemStatus;
  weight_lbs?: number;
  storageLocation?: string;
}

export interface ChecklistExportCategory {
  name: string;
  items: ChecklistExportItem[];
}

/** Checklist JSON shape accepted by Import List. */
export interface ChecklistExportDocument {
  version: typeof CHECKLIST_EXPORT_VERSION;
  format: typeof CHECKLIST_EXPORT_FORMAT | typeof LEGACY_CHECKLIST_EXPORT_FORMAT;
  tripName: string;
  exportedAt: string;
  categories: ChecklistExportCategory[];
}

export function tripToExportDocument(trip: TripRecord): ChecklistExportDocument {
  return {
    version: CHECKLIST_EXPORT_VERSION,
    format: CHECKLIST_EXPORT_FORMAT,
    tripName: trip.name,
    exportedAt: new Date().toISOString(),
    categories: trip.categories.map((category) => ({
      name: category.name,
      items: category.items.map((item) => ({
        name: item.name,
        status: item.status,
        ...(item.weight_lbs != null ? { weight_lbs: item.weight_lbs } : {}),
        ...(item.storageLocation ? { storageLocation: item.storageLocation } : {}),
      })),
    })),
  };
}
