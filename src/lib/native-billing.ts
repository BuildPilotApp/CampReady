import { Capacitor, registerPlugin } from "@capacitor/core";
import { IS_PRIME_TEST_LAB_BUILD } from "@/lib/build-config";
import { unlockProLocally } from "@/lib/pro";
import { isNativePlatform } from "@/lib/system-url-launcher";

/** Product ID must match Google Play Console and App Store Connect. */
export const CAMPREADY_PRO_PRODUCT_ID = "campready_pro_lifetime";

export type NativeStore = "android" | "ios";

export interface NativePurchaseResult {
  success: boolean;
  cancelled: boolean;
  error?: string;
}

export interface NativeRestoreResult {
  owned: boolean;
}

interface CampReadyBillingPlugin {
  purchaseProduct(options: { productId: string }): Promise<NativePurchaseResult>;
  restorePurchases(): Promise<NativeRestoreResult>;
}

const CampReadyBilling = registerPlugin<CampReadyBillingPlugin>("CampReadyBilling", {
  web: {
    purchaseProduct: async (): Promise<NativePurchaseResult> => ({
      success: false,
      cancelled: true,
    }),
    restorePurchases: async (): Promise<NativeRestoreResult> => ({
      owned: false,
    }),
  },
});

/** True on Android/iOS production builds where store billing is wired. */
export function canUseNativeStoreBilling(): boolean {
  if (!isNativePlatform() || IS_PRIME_TEST_LAB_BUILD) {
    return false;
  }
  const platform = Capacitor.getPlatform();
  return platform === "android" || platform === "ios";
}

/** @deprecated Prefer canUseNativeStoreBilling — kept for older call sites. */
export function canUseNativeGooglePlayBilling(): boolean {
  return canUseNativeStoreBilling();
}

export function getNativeStore(): NativeStore | null {
  if (!canUseNativeStoreBilling()) {
    return null;
  }
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return "ios";
  }
  if (platform === "android") {
    return "android";
  }
  return null;
}

export function getNativeStoreDisplayName(): string {
  return getNativeStore() === "ios" ? "App Store" : "Google Play";
}

export async function purchaseCampReadyPro(): Promise<NativePurchaseResult> {
  if (!canUseNativeStoreBilling()) {
    return { success: false, cancelled: true };
  }

  try {
    return await CampReadyBilling.purchaseProduct({
      productId: CAMPREADY_PRO_PRODUCT_ID,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Purchase could not be completed.";
    return { success: false, cancelled: false, error: message };
  }
}

export async function restoreNativeCampReadyPro(): Promise<boolean> {
  if (!canUseNativeStoreBilling()) {
    return false;
  }

  try {
    const result = await CampReadyBilling.restorePurchases();
    if (result.owned) {
      unlockProLocally();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
