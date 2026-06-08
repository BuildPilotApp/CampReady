import type { CampReadyDatabase, Category, TripRecord } from "@/types";
import { createTrip } from "./defaults";

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

export function createSeedDatabase(): CampReadyDatabase {
  const trip = createTrip({
    name: "Yosemite Weekend",
    startDate: defaultTripDate(),
    endDate: defaultTripDate(),
    location: { query: "Yosemite" },
  });

  const seededTrip: TripRecord = { ...trip, categories: [] };

  return {
    version: 1,
    trips: [seededTrip],
    templates: [],
    activeTripId: seededTrip.id,
  };
}

function defaultTripDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

export function ensureSeededDatabase(
  data: CampReadyDatabase,
): CampReadyDatabase {
  const base: CampReadyDatabase = {
    version: 1,
    trips: data.trips ?? [],
    templates: data.templates ?? [],
    activeTripId: data.activeTripId ?? data.trips?.[0]?.id ?? null,
  };

  if (base.trips.length > 0) {
    return base;
  }

  return createSeedDatabase();
}

export function isEmptyDatabase(data: CampReadyDatabase): boolean {
  return data.trips.length === 0;
}
