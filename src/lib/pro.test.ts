import { describe, expect, it } from "vitest";
import { IS_PRIME_TEST_LAB_BUILD } from "@/lib/build-config";
import {
  canCreateTemplate,
  canCreateTrip,
  isPrimeTestLabBypassActive,
} from "@/lib/pro";

describe("pro gating", () => {
  it("allows free users to create their first trip", () => {
    expect(canCreateTrip(false, 0)).toBe(true);
  });

  it("blocks a second trip on the free plan", () => {
    expect(canCreateTrip(false, 1)).toBe(false);
  });

  it("allows unlimited trips for Pro users", () => {
    expect(canCreateTrip(true, 25)).toBe(true);
  });

  it("allows free users to create their first saved checklist", () => {
    expect(canCreateTemplate(false, 0)).toBe(true);
  });

  it("blocks a second saved checklist on the free plan", () => {
    expect(canCreateTemplate(false, 1)).toBe(false);
  });
});

describe("release build config", () => {
  it("documents production mode for Play Store release", () => {
    expect(IS_PRIME_TEST_LAB_BUILD).toBe(false);
  });

  it("only bypasses billing on native when PrimeTestLab mode is on", () => {
    expect(isPrimeTestLabBypassActive()).toBe(false);
  });
});
