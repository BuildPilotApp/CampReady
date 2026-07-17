import { describe, expect, it } from "vitest";
import {
  formatChecklistAsCsv,
  formatChecklistAsText,
  formatGearInventoryCsvTemplate,
} from "@/lib/export-checklist";
import type { TripRecord } from "@/types";

const trip: TripRecord = {
  id: "trip-1",
  name: "Weekend",
  startDate: "2026-07-10",
  endDate: "2026-07-11",
  categories: [
    {
      id: "cat-1",
      name: "Kitchen",
      items: [
        {
          id: "item-1",
          category: "cat-1",
          name: "Stove",
          status: "packed",
          weight_lbs: 2,
        },
      ],
    },
  ],
  mealPrepDays: [
    {
      dayNumber: 1,
      items: [
        {
          id: "meal-1",
          title: "Chili",
          status: "available",
          recipeNotes: "Simmer 45 min",
        },
      ],
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("gear inventory export templates", () => {
  it("formats a blank CSV template with combined headers", () => {
    expect(formatGearInventoryCsvTemplate()).toBe(
      "Type,Category,Item,Status,Weight (lbs),Storage,Day,Recipe Notes",
    );
  });
});

describe("formatChecklistAsCsv", () => {
  it("exports gear and meal rows with a Type column", () => {
    const csv = formatChecklistAsCsv(trip);
    expect(csv).toContain(
      "Type,Category,Item,Status,Weight (lbs),Storage,Day,Recipe Notes",
    );
    expect(csv).toContain("Gear,Kitchen,Stove,Packed,2,,,");
    expect(csv).toContain("Meal,,Chili,Available,,,1,Simmer 45 min");
  });
});

describe("formatChecklistAsText", () => {
  it("includes a Meal Prep section when meals exist", () => {
    const text = formatChecklistAsText(trip);
    expect(text).toContain("Meal Prep");
    expect(text).toContain("Day 1");
    expect(text).toContain("[Available] Chili");
  });
});
