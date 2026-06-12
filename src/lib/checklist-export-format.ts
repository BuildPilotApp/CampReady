import type { GearItemStatus, TripRecord } from "@/types";

export const CHECKLIST_EXPORT_FORMAT = "campready-checklist" as const;
export const CHECKLIST_EXPORT_VERSION = 1 as const;

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

/** JSON document written by Export List and accepted by Import List. */
export interface ChecklistExportDocument {
  version: typeof CHECKLIST_EXPORT_VERSION;
  format: typeof CHECKLIST_EXPORT_FORMAT;
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
