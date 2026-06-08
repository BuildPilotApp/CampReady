import { flattenGearEntries } from "@/lib/gear-items";
import type {
  CampReadyDatabase,
  Category,
  GearItem,
  GearSubItem,
  Trip,
  TripRecord,
} from "@/types";
import { DATABASE_VERSION } from "./constants";

export function createEmptyDatabase(): CampReadyDatabase {
  return {
    version: DATABASE_VERSION,
    trips: [],
    templates: [],
    activeTripId: null,
  };
}

export function createTrip(
  partial: Pick<Trip, "name" | "startDate" | "endDate"> &
    Partial<Pick<Trip, "id" | "location">>,
): TripRecord {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    startDate: partial.startDate,
    endDate: partial.endDate,
    location: partial.location,
    categories: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createCategory(
  partial: Pick<Category, "name"> & Partial<Pick<Category, "id" | "items">>,
): Category {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    items: partial.items ?? [],
  };
}

export function createGearSubItem(
  partial: Pick<GearSubItem, "name"> &
    Partial<Pick<GearSubItem, "id" | "status" | "weight_lbs" | "storageLocation">>,
): GearSubItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    status: partial.status ?? "missing",
    weight_lbs: partial.weight_lbs,
    storageLocation: partial.storageLocation,
  };
}

export function createGearItem(
  partial: Pick<GearItem, "name" | "category"> &
    Partial<
      Pick<
        GearItem,
        "id" | "status" | "weight_lbs" | "storageLocation" | "isContainer" | "subItems"
      >
    >,
): GearItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    category: partial.category,
    status: partial.status ?? "missing",
    weight_lbs: partial.weight_lbs,
    storageLocation: partial.storageLocation,
    isContainer: partial.isContainer,
    subItems: partial.subItems,
  };
}

export function getTripStats(trip: TripRecord): {
  totalItems: number;
  packedItems: number;
  totalWeightLbs: number;
  percentPacked: number;
} {
  const items = trip.categories.flatMap((category) => category.items);
  const entries = flattenGearEntries(items);
  const totalItems = entries.length;
  const packedItems = entries.filter((entry) => {
    const status = entry.subItem?.status ?? entry.item.status;
    return status === "packed";
  }).length;
  const totalWeightLbs = entries.reduce((sum, entry) => {
    const weight = entry.subItem?.weight_lbs ?? entry.item.weight_lbs;
    return sum + (typeof weight === "number" ? weight : 0);
  }, 0);
  const percentPacked = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return { totalItems, packedItems, totalWeightLbs, percentPacked };
}

export function touchTrip(trip: TripRecord): TripRecord {
  return { ...trip, updatedAt: new Date().toISOString() };
}
