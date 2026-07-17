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
  /**
   * Optional meal-prep days keyed by relative day number.
   * Days outside the current date range are preserved but hidden.
   */
  mealPrepDays?: MealPrepDay[];
  createdAt: string;
  updatedAt: string;
}

/** Meal item lifecycle for trip meal prep. */
export type MealItemStatus = "available" | "consumed";

/** One food / recipe line item within a meal-prep day. */
export interface MealPrepItem {
  id: string;
  title: string;
  status: MealItemStatus;
  /** Freeform multi-line recipe notes; may include pasted links. */
  recipeNotes?: string;
}

/** Relative day bucket for meal prep (Day 1…N of the trip). */
export interface MealPrepDay {
  dayNumber: number;
  items: MealPrepItem[];
}

/** Primary app tab routes. */
export type AppTab = "dashboard" | "checklist" | "meal-prep";

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

/** Device-level Meal Prep nav preference (Pro feature). */
export interface MealPrepSettings {
  /** When true, show Meal Prep in bottom nav and desktop trip tools. */
  enabled: boolean;
}

/** Root document persisted to local storage. */
export interface CampReadyDatabase {
  version: 1;
  trips: TripRecord[];
  templates: ChecklistTemplate[];
  activeTripId: string | null;
  /** Optional; missing on older installs means the alarm is off. */
  vehiclePayload?: VehiclePayloadSettings;
  /** Optional; missing on older installs means Meal Prep nav is off. */
  mealPrep?: MealPrepSettings;
}
