import { describe, expect, it } from "vitest";
import { formatGearInventoryCsvTemplate } from "@/lib/export-checklist";

describe("gear inventory export templates", () => {
  it("formats a blank CSV template with importable headers", () => {
    expect(formatGearInventoryCsvTemplate()).toBe(
      "Category,Item,Status,Weight (lbs),Storage",
    );
  });
});
