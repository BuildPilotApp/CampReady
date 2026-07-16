import { describe, expect, it } from "vitest";
import {
  formatImportMergeSummary,
  mergeImportedCategories,
  validateChecklistImport,
} from "@/lib/import-checklist";
import { createCategory, createGearItem } from "@/lib/storage/defaults";

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

describe("formatImportMergeSummary", () => {
  it("summarizes merge results for the UI", () => {
    expect(
      formatImportMergeSummary({
        categories: [],
        categoriesAdded: 1,
        categoriesMerged: 0,
        itemsAdded: 3,
        itemsUpdated: 0,
      }),
    ).toBe("1 category added, 3 items added");
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
      "Category,Item,Status,Weight (lbs),Storage",
      "gear.csv",
      { suppressNotification: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.message).toBe(
        "This list is empty. Add at least one gear item before importing.",
      );
    }
  });
});
