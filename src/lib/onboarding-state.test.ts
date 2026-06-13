import { describe, expect, it } from "vitest";
import { shouldShowOnboarding } from "@/lib/onboarding-state";
import { createEmptyDatabase } from "@/lib/storage/defaults";

describe("shouldShowOnboarding", () => {
  it("returns true for a fresh database when onboarding is not complete", () => {
    expect(shouldShowOnboarding(createEmptyDatabase())).toBe(true);
  });
});
