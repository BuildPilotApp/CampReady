import { describe, expect, it } from "vitest";
import {
  CHECKLIST_EXPORT_FORMAT,
  CHECKLIST_EXPORT_VERSION,
} from "@/lib/checklist-export-format";
import {
  formatGearInventoryCsvTemplate,
  formatGearInventoryJsonTemplate,
} from "@/lib/export-checklist";

describe("gear inventory export templates", () => {
  it("formats a blank CSV template with importable headers", () => {
    expect(formatGearInventoryCsvTemplate()).toBe(
      "Category,Item,Status,Weight (lbs),Storage",
    );
  });

  it("formats a blank JSON template with CampReady metadata", () => {
    const parsed = JSON.parse(formatGearInventoryJsonTemplate()) as {
      version: number;
      format: string;
      tripName: string;
      categories: unknown[];
      instructions: string[];
    };

    expect(parsed.version).toBe(CHECKLIST_EXPORT_VERSION);
    expect(parsed.format).toBe(CHECKLIST_EXPORT_FORMAT);
    expect(parsed.tripName).toBe("Gear Inventory Template");
    expect(parsed.categories).toEqual([]);
    expect(parsed.instructions).toEqual(
      expect.arrayContaining([
        "Each item status must be one of: missing, staged, packed.",
      ]),
    );
  });
});
