/** Packing lifecycle for a single gear line item. */
export type GearItemStatus = "missing" | "staged" | "packed";

export interface TripLocation {
  /** Freeform place name typed by the user (e.g. "Yosemite", "Moab"). */
  query: string;
  /** Resolved coordinates from Open-Meteo geocoding (optional until resolved). */
  latitude?: number;
  longitude?: number;
  /** Human-friendly resolved name (optional). */
  resolvedName?: string;
}

/** A planned or active camping trip with aggregate pack progress. */
export interface Trip {
  id: string;
  name: string;
  /** ISO 8601 date string (YYYY-MM-DD). */
  startDate: string;
  /** ISO 8601 date string (YYYY-MM-DD). */
  endDate: string;
  location?: TripLocation;
}

/** One line item in a checklist, with weight for load planning. */
export interface GearItem {
  id: string;
  name: string;
  /** References {@link Category.id}. */
  category: string;
  status: GearItemStatus;
  weight_lbs?: number;
  /** Where the item lives when not packed (e.g. "Bin 1"). */
  storageLocation?: string;
}

/** Grouped checklist section containing gear line items. */
export interface Category {
  id: string;
  name: string;
  items: GearItem[];
}

/** Reusable checklist preset shown on the dashboard. */
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  categories: Category[];
}

/** A full trip record containing its checklist. */
export interface TripRecord extends Trip {
  categories: Category[];
  /** Last saved checklist loaded onto this trip, if any. */
  checklistTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Primary app tab routes. */
export type AppTab = "dashboard" | "checklist";

/** Info screen sub-views (opened from the app header). */
export type InfoView =
  | "menu"
  | "about"
  | "guide"
  | "terms"
  | "privacy"
  | "feedback"
  | "bug";

/** Checklist filter mode for the master list. */
export type ChecklistFilter = "all" | "remaining";

/** Device-level vehicle payload alarm preferences (Pro feature). */
export interface VehiclePayloadSettings {
  alarmEnabled: boolean;
  /** Canonical capacity in pounds; unset until the user enters a value. */
  maxPayloadCapacityLbs?: number;
}

/** Root document persisted to local storage. */
export interface CampReadyDatabase {
  version: 1;
  trips: TripRecord[];
  templates: ChecklistTemplate[];
  activeTripId: string | null;
  /** Optional; missing on older installs means the alarm is off. */
  vehiclePayload?: VehiclePayloadSettings;
}
