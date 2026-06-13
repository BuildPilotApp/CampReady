import { IS_PRIME_TEST_LAB_BUILD } from "@/lib/build-config";
import { isNativePlatform } from "@/lib/system-url-launcher";

export { IS_PRIME_TEST_LAB_BUILD };

export const PRO_STORAGE_KEY = "campready_pro";

export const FREE_TRIP_LIMIT = 1;
export const FREE_TEMPLATE_LIMIT = 1;

export function readProStatus(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_STORAGE_KEY) === "true";
}

export function setProStatus(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_STORAGE_KEY, enabled ? "true" : "false");
}

export function unlockProLocally(): void {
  setProStatus(true);
}

export function applyPrimeTestLabProBypassOnLaunch(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!IS_PRIME_TEST_LAB_BUILD || !isNativePlatform()) {
    return;
  }
  unlockProLocally();
}

export function isPrimeTestLabBypassActive(): boolean {
  return IS_PRIME_TEST_LAB_BUILD && isNativePlatform();
}

export function hasProEntitlement(purchasedPro: boolean): boolean {
  return purchasedPro;
}

export function canCreateTrip(purchasedPro: boolean, tripCount: number): boolean {
  return hasProEntitlement(purchasedPro) || tripCount < FREE_TRIP_LIMIT;
}

export function canCreateTemplate(
  purchasedPro: boolean,
  templateCount: number,
): boolean {
  return hasProEntitlement(purchasedPro) || templateCount < FREE_TEMPLATE_LIMIT;
}
