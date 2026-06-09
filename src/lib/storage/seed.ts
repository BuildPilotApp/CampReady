import type { CampReadyDatabase, Category, TripRecord } from "@/types";
import { DATABASE_VERSION } from "./constants";

/** Legacy seed trip — removed from stored data on load. */
export const SAMPLE_TRIP_NAME = "Yosemite Weekend";

export function isSampleTrip(trip: TripRecord): boolean {
  const location = trip.location?.query?.trim().toLowerCase() ?? "";
  return trip.name === SAMPLE_TRIP_NAME && location === "yosemite";
}

export function cloneCategories(categories: Category[]): Category[] {
  return categories.map((category) => {
    const categoryId = crypto.randomUUID();
    return {
      id: categoryId,
      name: category.name,
      items: category.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        category: categoryId,
        status: "missing" as const,
      })),
    };
  });
}

/** Normalize persisted data without injecting sample content. */
export function ensureSeededDatabase(
  data: CampReadyDatabase,
): CampReadyDatabase {
  const trips = (data.trips ?? []).filter((trip) => !isSampleTrip(trip));

  return {
    version: DATABASE_VERSION,
    trips,
    templates: data.templates ?? [],
    activeTripId:
      data.activeTripId && trips.some((trip) => trip.id === data.activeTripId)
        ? data.activeTripId
        : trips[0]?.id ?? null,
  };
}

export function isEmptyDatabase(data: CampReadyDatabase): boolean {
  return data.trips.length === 0;
}
