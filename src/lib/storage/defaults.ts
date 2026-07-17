import type {
  CampReadyDatabase,
  Category,
  GearItem,
  MealItemStatus,
  MealPrepDay,
  MealPrepItem,
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
    vehiclePayload: {
      alarmEnabled: false,
    },
    mealPrep: {
      enabled: false,
    },
  };
}

export function createDefaultVehiclePayloadSettings(): NonNullable<
  CampReadyDatabase["vehiclePayload"]
> {
  return { alarmEnabled: false };
}

export function createDefaultMealPrepSettings(): NonNullable<
  CampReadyDatabase["mealPrep"]
> {
  return { enabled: false };
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
    mealPrepDays: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createMealPrepItem(
  partial: Pick<MealPrepItem, "title"> &
    Partial<Pick<MealPrepItem, "id" | "status" | "recipeNotes">>,
): MealPrepItem {
  const notes =
    typeof partial.recipeNotes === "string" && partial.recipeNotes.trim()
      ? partial.recipeNotes.trim()
      : undefined;

  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title,
    status: partial.status ?? "available",
    ...(notes ? { recipeNotes: notes } : {}),
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
    Partial<Pick<GearItem, "id" | "status" | "weight_lbs" | "storageLocation">>,
): GearItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    category: partial.category,
    status: partial.status ?? "missing",
    weight_lbs: partial.weight_lbs,
    storageLocation: partial.storageLocation,
  };
}

export function getTripStats(trip: TripRecord): {
  totalItems: number;
  packedItems: number;
  totalWeightLbs: number;
  percentPacked: number;
} {
  const items = trip.categories.flatMap((category) => category.items);
  const totalItems = items.length;
  const packedItems = items.filter((item) => item.status === "packed").length;
  const totalWeightLbs = items.reduce(
    (sum, item) => sum + (typeof item.weight_lbs === "number" ? item.weight_lbs : 0),
    0,
  );
  const percentPacked = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return { totalItems, packedItems, totalWeightLbs, percentPacked };
}

export function touchTrip(trip: TripRecord): TripRecord {
  return { ...trip, updatedAt: new Date().toISOString() };
}

export type { MealItemStatus, MealPrepDay, MealPrepItem };
