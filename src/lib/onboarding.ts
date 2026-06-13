export const WELCOME_DISMISSED_KEY = "campready:welcome-dismissed";

export function isWelcomeDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return localStorage.getItem(WELCOME_DISMISSED_KEY) === "true";
}

export function dismissWelcome(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
}

export const WELCOME_STEPS = [
  {
    title: "Create a trip",
    body: "Add dates and a location on the Dashboard. Weather appears when a place is set.",
  },
  {
    title: "Build your gear list",
    body: "Add categories and items on the Gear Checklist tab, or load the optional weekend starter.",
  },
  {
    title: "Pack item by item",
    body: "Tap each item to stage it, then tap again when it is packed in your vehicle.",
  },
] as const;
