import type { CampReadyDatabase, Category } from "@/types";
import { getTemplateById } from "@/lib/templates";
import { createEmptyDatabase, createTrip, syncTripCounts } from "./defaults";

const DEFAULT_TEMPLATE_ID = "weekend-car-camping";

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
  const template = getTemplateById(DEFAULT_TEMPLATE_ID);
  const trip = createTrip({
    name: "Yosemite Weekend",
    date: defaultTripDate(),
  });

  const categories = template ? cloneCategories(template.categories) : [];
  const syncedTrip = syncTripCounts(trip, categories);

  return {
    version: 1,
    trips: [syncedTrip],
    categories,
    activeTripId: syncedTrip.id,
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
  if (data.trips.length > 0 && data.categories.length > 0) {
    return {
      ...data,
      activeTripId: data.activeTripId ?? data.trips[0]?.id ?? null,
    };
  }
  return createSeedDatabase();
}

export function isEmptyDatabase(data: CampReadyDatabase): boolean {
  return data.trips.length === 0 && data.categories.length === 0;
}
