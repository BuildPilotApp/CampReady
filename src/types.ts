/** Packing lifecycle for a single gear line item. */
export type GearItemStatus = "missing" | "staged" | "packed";

/** A planned or active camping trip with aggregate pack progress. */
export interface Trip {
  id: string;
  name: string;
  /** ISO 8601 date string (YYYY-MM-DD). */
  date: string;
  totalItems: number;
  packedItems: number;
}

/** One line item in a checklist, with weight for load planning. */
export interface GearItem {
  id: string;
  name: string;
  /** References {@link Category.id}. */
  category: string;
  status: GearItemStatus;
  weight_lbs: number;
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

/** Primary app tab routes. */
export type AppTab = "dashboard" | "checklist";

/** Checklist filter mode for the master list. */
export type ChecklistFilter = "all" | "remaining";

/** Root document persisted to local storage. */
export interface CampReadyDatabase {
  version: 1;
  trips: Trip[];
  categories: Category[];
  activeTripId: string | null;
}
