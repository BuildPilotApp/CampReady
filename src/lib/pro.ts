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

export function canCreateTrip(isPro: boolean, tripCount: number): boolean {
  return isPro || tripCount < FREE_TRIP_LIMIT;
}

export function canCreateTemplate(isPro: boolean, templateCount: number): boolean {
  return isPro || templateCount < FREE_TEMPLATE_LIMIT;
}
