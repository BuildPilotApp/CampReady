import { describe, expect, it } from "vitest";
import {
  canCreateTemplate,
  canCreateTrip,
  isCheckoutSuccessUrl,
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

describe("checkout success detection", () => {
  it("recognizes the web success query parameter", () => {
    expect(
      isCheckoutSuccessUrl(
        "https://buildpilotapp.github.io/CampReady/?checkout=success",
      ),
    ).toBe(true);
  });

  it("recognizes the native success path", () => {
    expect(isCheckoutSuccessUrl("campready://checkout/success")).toBe(true);
  });

  it("ignores unrelated URLs", () => {
    expect(isCheckoutSuccessUrl("https://example.com/")).toBe(false);
  });
});
