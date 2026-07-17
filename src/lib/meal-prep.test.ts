import { describe, expect, it } from "vitest";
import {
  getVisibleMealPrepDays,
  upsertMealPrepDayItems,
} from "@/lib/meal-prep";
import type { TripRecord } from "@/types";

function makeTrip(
  startDate: string,
  endDate: string,
  mealPrepDays?: TripRecord["mealPrepDays"],
): TripRecord {
  return {
    id: "trip-1",
    name: "Test Trip",
    startDate,
    endDate,
    categories: [],
    mealPrepDays,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("getVisibleMealPrepDays", () => {
  it("produces one day for a same-day trip", () => {
    const days = getVisibleMealPrepDays(makeTrip("2026-07-10", "2026-07-10"));
    expect(days).toHaveLength(1);
    expect(days[0]?.dayNumber).toBe(1);
    expect(days[0]?.dateIso).toBe("2026-07-10");
  });

  it("numbers multi-day ranges inclusively", () => {
    const days = getVisibleMealPrepDays(makeTrip("2026-07-10", "2026-07-12"));
    expect(days.map((day) => day.dayNumber)).toEqual([1, 2, 3]);
    expect(days.map((day) => day.dateIso)).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });

  it("handles month and year boundaries including leap day", () => {
    const days = getVisibleMealPrepDays(makeTrip("2024-02-28", "2024-03-01"));
    expect(days.map((day) => day.dateIso)).toEqual([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]);
  });

  it("returns no days for an inverted range", () => {
    expect(getVisibleMealPrepDays(makeTrip("2026-07-12", "2026-07-10"))).toEqual(
      [],
    );
  });

  it("merges stored items and preserves hidden later days when shortened", () => {
    const trip = makeTrip("2026-07-10", "2026-07-11", [
      {
        dayNumber: 1,
        items: [
          {
            id: "m1",
            title: "Oatmeal",
            status: "consumed",
          },
        ],
      },
      {
        dayNumber: 3,
        items: [
          {
            id: "m3",
            title: "Steak",
            status: "available",
            recipeNotes: "Grill medium",
          },
        ],
      },
    ]);

    const visible = getVisibleMealPrepDays(trip);
    expect(visible).toHaveLength(2);
    expect(visible[0]?.items[0]?.title).toBe("Oatmeal");
    expect(visible[0]?.consumedCount).toBe(1);
    expect(visible[1]?.items).toEqual([]);

    // Extending the trip restores the preserved Day 3 meals.
    const extended = getVisibleMealPrepDays({
      ...trip,
      endDate: "2026-07-12",
    });
    expect(extended).toHaveLength(3);
    expect(extended[2]?.items[0]?.title).toBe("Steak");
    expect(extended[2]?.items[0]?.recipeNotes).toBe("Grill medium");
  });
});

describe("upsertMealPrepDayItems", () => {
  it("preserves other days when updating one day", () => {
    const next = upsertMealPrepDayItems(
      [
        {
          dayNumber: 1,
          items: [{ id: "a", title: "A", status: "available" }],
        },
        {
          dayNumber: 5,
          items: [{ id: "b", title: "B", status: "available" }],
        },
      ],
      1,
      [{ id: "a2", title: "A2", status: "consumed" }],
    );

    expect(next).toEqual([
      {
        dayNumber: 1,
        items: [{ id: "a2", title: "A2", status: "consumed" }],
      },
      {
        dayNumber: 5,
        items: [{ id: "b", title: "B", status: "available" }],
      },
    ]);
  });
});
