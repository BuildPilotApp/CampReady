import { registerPlugin } from "@capacitor/core";
import { IS_PRIME_TEST_LAB_BUILD, unlockProLocally } from "@/lib/pro";
import { isNativePlatform } from "@/lib/system-url-launcher";

export const CAMPREADY_PRO_PRODUCT_ID = "campready_pro_lifetime";

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

export function canUseNativeGooglePlayBilling(): boolean {
  return isNativePlatform() && !IS_PRIME_TEST_LAB_BUILD;
}

export async function purchaseCampReadyPro(): Promise<NativePurchaseResult> {
  if (!canUseNativeGooglePlayBilling()) {
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
  if (!canUseNativeGooglePlayBilling()) {
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
