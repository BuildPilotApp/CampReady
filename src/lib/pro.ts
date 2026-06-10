export const PRO_STORAGE_KEY = "campready_pro";

export const STRIPE_CHECKOUT_URL =
  "https://buy.stripe.com/00w28s5UnaNeaYybl6cV201";

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

export function canCreateTrip(isPro: boolean, tripCount: number): boolean {
  return isPro || tripCount < FREE_TRIP_LIMIT;
}

export function canCreateTemplate(isPro: boolean, templateCount: number): boolean {
  return isPro || templateCount < FREE_TEMPLATE_LIMIT;
}
