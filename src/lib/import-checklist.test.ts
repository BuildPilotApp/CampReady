import { describe, expect, it } from "vitest";
import {
  buildChecklistRows,
  buildChecklistWorkbook,
} from "@/lib/export-checklist";
import {
  formatImportMergeSummary,
  mergeImportedCategories,
  mergeImportedMealItems,
  validateChecklistImport,
  validateChecklistXlsx,
} from "@/lib/import-checklist";
import type { TripRecord } from "@/types";
import { createCategory, createGearItem, createMealPrepItem } from "@/lib/storage/defaults";

describe("mergeImportedCategories", () => {
  it("adds new categories and items without duplicating existing names", () => {
    const kitchen = createCategory({ name: "Kitchen" });
    kitchen.items = [
      createGearItem({
        name: "Stove",
        category: kitchen.id,
        status: "packed",
      }),
    ];

    const result = mergeImportedCategories([kitchen], [
      {
        name: "Kitchen",
        items: [
          { name: "Stove", status: "missing", weight_lbs: 2 },
          { name: "Cooler", status: "missing" },
        ],
      },
      {
        name: "Shelter",
        items: [{ name: "Tent", status: "missing" }],
      },
    ]);

    expect(result.categoriesMerged).toBe(1);
    expect(result.categoriesAdded).toBe(1);
    expect(result.itemsAdded).toBe(2);
    expect(result.itemsUpdated).toBe(1);
    expect(result.categories).toHaveLength(2);
    expect(result.mealsAdded).toBe(0);
    expect(
      result.categories
        .find((category) => category.name === "Kitchen")
        ?.items.some((item) => item.name === "Cooler"),
    ).toBe(true);
    expect(
      result.categories
        .find((category) => category.name === "Kitchen")
        ?.items.find((item) => item.name === "Stove")?.weight_lbs,
    ).toBe(2);
    expect(
      result.categories
        .find((category) => category.name === "Kitchen")
        ?.items.find((item) => item.name === "Stove")?.status,
    ).toBe("packed");
  });
});

describe("mergeImportedMealItems", () => {
  it("adds and updates meals by day and title without wiping other days", () => {
    const existing = [
      {
        dayNumber: 1,
        items: [
          createMealPrepItem({ title: "Chili", status: "available" }),
        ],
      },
      {
        dayNumber: 3,
        items: [
          createMealPrepItem({ title: "Hidden omelette", status: "available" }),
        ],
      },
    ];

    const result = mergeImportedMealItems(existing, [
      {
        dayNumber: 1,
        title: "Chili",
        status: "consumed",
        recipeNotes: "Heat and serve",
      },
      {
        dayNumber: 1,
        title: "Trail mix",
        status: "available",
      },
    ]);

    expect(result.mealsAdded).toBe(1);
    expect(result.mealsUpdated).toBe(1);
    expect(result.mealPrepDays).toHaveLength(2);
    const day1 = result.mealPrepDays.find((day) => day.dayNumber === 1);
    expect(day1?.items).toHaveLength(2);
    expect(day1?.items.find((item) => item.title === "Chili")?.status).toBe(
      "consumed",
    );
    expect(
      result.mealPrepDays.find((day) => day.dayNumber === 3)?.items[0]?.title,
    ).toBe("Hidden omelette");
  });
});

describe("formatImportMergeSummary", () => {
  it("summarizes merge results for the UI", () => {
    expect(
      formatImportMergeSummary({
        categories: [],
        categoriesAdded: 1,
        categoriesMerged: 0,
        itemsAdded: 3,
        itemsUpdated: 0,
        mealsAdded: 0,
        mealsUpdated: 0,
      }),
    ).toBe("1 category added, 3 items added");

    expect(
      formatImportMergeSummary({
        categories: [],
        categoriesAdded: 0,
        categoriesMerged: 0,
        itemsAdded: 0,
        itemsUpdated: 0,
        mealsAdded: 2,
        mealsUpdated: 1,
      }),
    ).toBe("2 meals added, 1 meal updated");
  });
});

describe("validateChecklistImport", () => {
  it("defaults blank CSV status to Needed and allows optional fields", () => {
    const result = validateChecklistImport(
      [
        "Category,Item,Status,Weight (lbs),Storage",
        "Kitchen,Stove,,,",
      ].join("\n"),
      "gear.csv",
      { suppressNotification: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.categories[0]?.items[0]).toMatchObject({
        name: "Stove",
        status: "missing",
      });
      expect(result.data.categories[0]?.items[0]?.weight_lbs).toBeUndefined();
      expect(result.data.categories[0]?.items[0]?.storageLocation).toBeUndefined();
    }
  });

  it("rejects a blank CSV template with a helpful empty-list message", () => {
    const result = validateChecklistImport(
      "Type,Category,Item,Status,Weight (lbs),Storage,Day,Recipe Notes",
      "gear.csv",
      { suppressNotification: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.message).toBe(
        "This list is empty. Add at least one gear or meal item before importing.",
      );
    }
  });

  it("imports combined Gear and Meal rows from one CSV", () => {
    const result = validateChecklistImport(
      [
        "Type,Category,Item,Status,Weight (lbs),Storage,Day,Recipe Notes",
        "Gear,Kitchen,Stove,Needed,2,Bin,,",
        "Meal,,Chili,Consumed,,,1,Simmer",
      ].join("\n"),
      "trip.csv",
      { suppressNotification: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.categories[0]?.items[0]?.name).toBe("Stove");
      expect(result.data.mealItems).toEqual([
        {
          dayNumber: 1,
          title: "Chili",
          status: "consumed",
          recipeNotes: "Simmer",
        },
      ]);
    }
  });

  it("imports meal-only CSV without gear rows", () => {
    const result = validateChecklistImport(
      [
        "Type,Category,Item,Status,Weight (lbs),Storage,Day,Recipe Notes",
        "Meal,,Oatmeal,Available,,,2,",
      ].join("\n"),
      "meals.csv",
      { suppressNotification: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.categories).toEqual([]);
      expect(result.data.mealItems?.[0]?.title).toBe("Oatmeal");
      expect(result.data.mealItems?.[0]?.dayNumber).toBe(2);
    }
  });

  it("round-trips gear and meals through xlsx", async () => {
    const trip: TripRecord = {
      id: "trip-xlsx",
      name: "Export",
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
              storageLocation: "Bin",
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
              recipeNotes: "Simmer",
            },
          ],
        },
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const workbook = await buildChecklistWorkbook(buildChecklistRows(trip));
    const buffer = await workbook.xlsx.writeBuffer();
    const data =
      buffer instanceof ArrayBuffer
        ? buffer
        : buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          );

    const result = await validateChecklistXlsx(data as ArrayBuffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sourceFormat).toBe("xlsx");
      expect(result.data.categories[0]?.items[0]?.name).toBe("Stove");
      expect(result.data.mealItems).toEqual([
        {
          dayNumber: 1,
          title: "Chili",
          status: "available",
          recipeNotes: "Simmer",
        },
      ]);
    }
  });
});
