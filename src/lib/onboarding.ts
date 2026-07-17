export const WELCOME_DISMISSED_KEY = "campready:welcome-dismissed";
export const ONBOARDING_COMPLETED_KEY = "campready:onboarding:v1:completed";

function getLocalStorageValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // The app still works if storage is unavailable; onboarding may reappear.
  }
}

export function isWelcomeDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return getLocalStorageValue(WELCOME_DISMISSED_KEY) === "true";
}

export function dismissWelcome(): void {
  setLocalStorageValue(WELCOME_DISMISSED_KEY, "true");
}

export function isFirstLaunchOnboardingComplete(): boolean {
  return (
    getLocalStorageValue(ONBOARDING_COMPLETED_KEY) === "true" ||
    getLocalStorageValue(WELCOME_DISMISSED_KEY) === "true"
  );
}

export function shouldShowFirstLaunchOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return !isFirstLaunchOnboardingComplete();
}

export function completeFirstLaunchOnboarding(): void {
  setLocalStorageValue(ONBOARDING_COMPLETED_KEY, "true");
  dismissWelcome();
}

export const FIRST_LAUNCH_ONBOARDING_STEPS = [
  {
    eyebrow: "Welcome",
    title: "Plan each trip before you pack",
    body: "CampSync keeps trips, dates, locations, reusable gear inventories, and pack status organized on this device.",
  },
  {
    eyebrow: "Dashboard",
    title: "Start on the Dashboard",
    body: "Create a trip, load the quick getaway trip, add dates and a location, and watch progress and weather from one place.",
  },
  {
    eyebrow: "Gear Checklist",
    title: "Add gear or load inventory",
    body: "Use Add gear for quick entries, expand Gear inventory for saved checklists, or download blank templates when you are starting from scratch.",
  },
  {
    eyebrow: "Pack Mode",
    title: "Tap from needed to packed",
    body: "Tap items through Needed, Staged, and Packed, filter what remains, and keep an eye on total packed weight.",
  },
  {
    eyebrow: "Backups & Settings",
    title: "Keep your setup portable",
    body: "Export text or spreadsheet (.xlsx) pack lists, back up all CampSync data from Settings, and switch the app theme whenever you need.",
  },
] as const;
