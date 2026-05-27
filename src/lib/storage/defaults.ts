import type { CampReadyDatabase, Category, GearItem, Trip } from "@/types";
import { DATABASE_VERSION } from "./constants";

export function createEmptyDatabase(): CampReadyDatabase {
  return {
    version: DATABASE_VERSION,
    trips: [],
    categories: [],
    activeTripId: null,
  };
}

export function createTrip(
  partial: Pick<Trip, "name" | "date"> & Partial<Pick<Trip, "id">>,
): Trip {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    date: partial.date,
    totalItems: 0,
    packedItems: 0,
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

export function createGearItem(
  partial: Pick<GearItem, "name" | "category"> &
    Partial<Pick<GearItem, "id" | "status" | "weight_lbs">>,
): GearItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    category: partial.category,
    status: partial.status ?? "missing",
    weight_lbs: partial.weight_lbs ?? 0,
  };
}

/** Recompute denormalized trip counters from category item statuses. */
export function syncTripCounts(
  trip: Trip,
  categories: Category[],
): Trip {
  const items = categories.flatMap((category) => category.items);
  const totalItems = items.length;
  const packedItems = items.filter((item) => item.status === "packed").length;

  return { ...trip, totalItems, packedItems };
}
