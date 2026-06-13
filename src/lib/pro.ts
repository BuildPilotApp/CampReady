import { isNativePlatform } from "@/lib/system-url-launcher";

export const IS_PRIME_TEST_LAB_BUILD = true;

export const PRO_STORAGE_KEY = "campready_pro";

export const STRIPE_CHECKOUT_URL =
  "https://buy.stripe.com/eVqcN65Un6wY6Iiah2cV202";

/**
 * Configure this as the Stripe Payment Link success URL for native builds
 * (Android/iOS WebView or Capacitor). The app listens for this callback on
 * launch and when returning from the system browser.
 */
export const NATIVE_CHECKOUT_SUCCESS_URL = "campready://checkout/success";

export const CHECKOUT_SUCCESS_PARAM = "checkout";
export const CHECKOUT_SUCCESS_VALUE = "success";

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

export function isCheckoutSuccessUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    const normalizedHref = parsed.href.replace(/\/+$/, "");
    if (normalizedHref === NATIVE_CHECKOUT_SUCCESS_URL) {
      return true;
    }

    if (parsed.searchParams.get(CHECKOUT_SUCCESS_PARAM) === CHECKOUT_SUCCESS_VALUE) {
      return true;
    }

    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    if (
      normalizedPath.endsWith("/checkout/success") ||
      normalizedPath === "checkout/success"
    ) {
      return true;
    }

    const hash = parsed.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(
      hash.includes("=") ? hash : hash.replace(/^\/?/, ""),
    );
    if (hashParams.get(CHECKOUT_SUCCESS_PARAM) === CHECKOUT_SUCCESS_VALUE) {
      return true;
    }

    return false;
  } catch {
    return url.includes(`${CHECKOUT_SUCCESS_PARAM}=${CHECKOUT_SUCCESS_VALUE}`);
  }
}

export function clearCheckoutCallbackFromLocation(): void {
  if (typeof window === "undefined") return;

  const { location, history } = window;

  try {
    const url = new URL(location.href);
    let changed = false;

    if (url.searchParams.has(CHECKOUT_SUCCESS_PARAM)) {
      url.searchParams.delete(CHECKOUT_SUCCESS_PARAM);
      changed = true;
    }

    const normalizedPath = url.pathname.replace(/\/+$/, "");
    if (normalizedPath.endsWith("/checkout/success")) {
      url.pathname = normalizedPath.replace(/\/?checkout\/success$/, "") || "/";
      changed = true;
    }

    if (url.hash.includes(CHECKOUT_SUCCESS_PARAM)) {
      url.hash = "";
      changed = true;
    }

    if (changed) {
      const next = `${url.pathname}${url.search}${url.hash}`;
      history.replaceState({}, "", next);
    }
  } catch {
    if (location.search.includes(CHECKOUT_SUCCESS_PARAM)) {
      history.replaceState({}, "", location.pathname + location.hash);
    }
  }
}

/**
 * Activates Pro when a native or local checkout callback is present, then
 * strips callback parameters from the active location.
 */
export function tryActivateProFromCheckoutCallback(
  href: string = typeof window !== "undefined" ? window.location.href : "",
): boolean {
  if (!href || !isCheckoutSuccessUrl(href)) {
    return false;
  }

  unlockProLocally();
  clearCheckoutCallbackFromLocation();
  return true;
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

export type RestoreProResult = "activated" | "already_pro" | "not_found";

/**
 * Re-checks the current URL and device storage for a completed Stripe checkout.
 * Use after returning from the payment browser tab.
 */
export function attemptRestoreProPurchase(): RestoreProResult {
  if (typeof window === "undefined") {
    return "not_found";
  }

  if (readProStatus()) {
    return "already_pro";
  }

  if (tryActivateProFromCheckoutCallback()) {
    return "activated";
  }

  return "not_found";
}

/** Documented success URL pattern for Stripe Payment Link configuration. */
export function getWebCheckoutSuccessUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  return `${normalized}/?checkout=success`;
}
