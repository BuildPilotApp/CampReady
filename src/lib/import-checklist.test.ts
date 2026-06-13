import { describe, expect, it } from "vitest";
import {
  formatImportMergeSummary,
  mergeImportedCategories,
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
