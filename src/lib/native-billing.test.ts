import { describe, expect, it } from "vitest";
import {
  CAMPREADY_PRO_PRODUCT_ID,
  canUseNativeGooglePlayBilling,
  canUseNativeStoreBilling,
  getNativeStore,
  getNativeStoreDisplayName,
} from "@/lib/native-billing";

describe("native billing helpers (web)", () => {
  it("keeps the shared lifetime product id aligned across stores", () => {
    expect(CAMPREADY_PRO_PRODUCT_ID).toBe("campready_pro_lifetime");
  });

  it("disables store billing in the browser", () => {
    expect(canUseNativeStoreBilling()).toBe(false);
    expect(canUseNativeGooglePlayBilling()).toBe(false);
    expect(getNativeStore()).toBeNull();
  });

  it("defaults store display name when not on a native store build", () => {
    expect(getNativeStoreDisplayName()).toBe("Google Play");
  });
});
