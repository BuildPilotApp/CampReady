import { describe, expect, it } from "vitest";
import { keyboardScrollDelta } from "@/lib/scroll-into-keyboard-view";

describe("keyboardScrollDelta", () => {
  it("does not scroll a field that is already visible", () => {
    expect(
      keyboardScrollDelta({
        rectTop: 80,
        rectBottom: 128,
        viewportHeight: 700,
        offsetTop: 0,
      }),
    ).toBe(0);
  });

  it("scrolls only the overflow when the keyboard covers the field", () => {
    expect(
      keyboardScrollDelta({
        rectTop: 360,
        rectBottom: 420,
        viewportHeight: 400,
        offsetTop: 0,
        padding: 16,
      }),
    ).toBe(36);
  });

  it("does not scroll the window when iOS has already panned the visual viewport", () => {
    expect(
      keyboardScrollDelta({
        rectTop: 360,
        rectBottom: 420,
        viewportHeight: 400,
        offsetTop: 120,
        padding: 16,
      }),
    ).toBe(0);
  });

  it("scrolls up when the field is clipped above the visible band", () => {
    expect(
      keyboardScrollDelta({
        rectTop: -20,
        rectBottom: 28,
        viewportHeight: 700,
        offsetTop: 0,
        padding: 16,
      }),
    ).toBe(-36);
  });
});
