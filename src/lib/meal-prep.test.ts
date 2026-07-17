import { describe, expect, it } from "vitest";
import {
  getMealDayProgress,
  getMealPrepSummary,
  getVisibleMealPrepDays,
  resolveFocusDayNumber,
  truncateRecipePreview,
  upsertMealPrepDayItems,
  type VisibleMealPrepDay,
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

function makeDay(
  partial: Partial<VisibleMealPrepDay> &
    Pick<VisibleMealPrepDay, "dayNumber" | "dateIso">,
): VisibleMealPrepDay {
  const items = partial.items ?? [];
  const consumedCount =
    partial.consumedCount ??
    items.filter((item) => item.status === "consumed").length;
  return {
    dayNumber: partial.dayNumber,
    dateIso: partial.dateIso,
    dateLabel: partial.dateLabel ?? partial.dateIso,
    items,
    consumedCount,
    totalCount: partial.totalCount ?? items.length,
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

describe("getMealPrepSummary", () => {
  it("aggregates counts and finds the next unconsumed item", () => {
    const days = [
      makeDay({
        dayNumber: 1,
        dateIso: "2026-07-10",
        dateLabel: "Jul 10",
        items: [
          { id: "1", title: "Oatmeal", status: "consumed" },
          { id: "2", title: "Chili", status: "available" },
        ],
      }),
      makeDay({
        dayNumber: 2,
        dateIso: "2026-07-11",
        dateLabel: "Jul 11",
        items: [{ id: "3", title: "Steak", status: "available" }],
      }),
    ];

    expect(getMealPrepSummary(days)).toEqual({
      totalCount: 3,
      consumedCount: 1,
      remainingCount: 2,
      nextItem: {
        dayNumber: 1,
        title: "Chili",
        dateLabel: "Jul 10",
      },
    });
  });

  it("returns null nextItem when everything is consumed", () => {
    const days = [
      makeDay({
        dayNumber: 1,
        dateIso: "2026-07-10",
        items: [{ id: "1", title: "Oatmeal", status: "consumed" }],
      }),
    ];

    const summary = getMealPrepSummary(days);
    expect(summary.remainingCount).toBe(0);
    expect(summary.nextItem).toBeNull();
  });
});

describe("resolveFocusDayNumber", () => {
  const days = [
    makeDay({
      dayNumber: 1,
      dateIso: "2026-07-10",
      items: [{ id: "1", title: "A", status: "consumed" }],
    }),
    makeDay({
      dayNumber: 2,
      dateIso: "2026-07-11",
      items: [{ id: "2", title: "B", status: "available" }],
    }),
    makeDay({
      dayNumber: 3,
      dateIso: "2026-07-12",
      items: [],
    }),
  ];

  it("focuses today when today is inside the trip", () => {
    expect(resolveFocusDayNumber(days, "2026-07-11")).toBe(2);
  });

  it("focuses the first day with remaining items when today is before the trip", () => {
    expect(resolveFocusDayNumber(days, "2026-07-01")).toBe(2);
  });

  it("focuses the first day with remaining items when today is after the trip", () => {
    expect(resolveFocusDayNumber(days, "2026-07-20")).toBe(2);
  });

  it("falls back to Day 1 when all items are consumed", () => {
    const allConsumed = [
      makeDay({
        dayNumber: 1,
        dateIso: "2026-07-10",
        items: [{ id: "1", title: "A", status: "consumed" }],
      }),
      makeDay({
        dayNumber: 2,
        dateIso: "2026-07-11",
        items: [{ id: "2", title: "B", status: "consumed" }],
      }),
    ];
    expect(resolveFocusDayNumber(allConsumed, "2026-07-20")).toBe(1);
  });

  it("returns null for an empty day list", () => {
    expect(resolveFocusDayNumber([], "2026-07-10")).toBeNull();
  });
});

describe("getMealDayProgress", () => {
  it("classifies empty, partial, and complete days", () => {
    expect(getMealDayProgress({ totalCount: 0, consumedCount: 0 })).toBe(
      "empty",
    );
    expect(getMealDayProgress({ totalCount: 3, consumedCount: 1 })).toBe(
      "partial",
    );
    expect(getMealDayProgress({ totalCount: 2, consumedCount: 2 })).toBe(
      "complete",
    );
  });
});

describe("truncateRecipePreview", () => {
  it("normalizes whitespace and truncates long notes", () => {
    expect(truncateRecipePreview("  Simmer\nfor 45 min  ")).toBe(
      "Simmer for 45 min",
    );
    const long = "a".repeat(100);
    const preview = truncateRecipePreview(long, 80);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBe(80);
  });
});
