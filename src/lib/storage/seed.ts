import type { CampReadyDatabase, Category, ChecklistTemplate, TripRecord } from "@/types";
import { CHECKLIST_TEMPLATES, getTemplateById, SAMPLE_TEMPLATE_ID } from "@/lib/templates";
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
  const template = getTemplateById(SAMPLE_TEMPLATE_ID);
  const trip = createTrip({
    name: "Yosemite Weekend",
    startDate: defaultTripDate(),
    endDate: defaultTripDate(),
    location: { query: "Yosemite" },
  });

  const categories = template ? cloneCategories(template.categories) : [];
  const seededTrip: TripRecord = { ...trip, categories };

  return {
    version: 1,
    trips: [seededTrip],
    templates: CHECKLIST_TEMPLATES,
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
    templates: data.templates ?? CHECKLIST_TEMPLATES,
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
