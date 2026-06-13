const HINT_PREFIX = "campready:hint-dismissed:";

export type OnboardingHintId =
  | "gear-inventory"
  | "checklist-categories"
  | "first-trip-packed";

function hintKey(id: OnboardingHintId): string {
  return `${HINT_PREFIX}${id}`;
}

export function isOnboardingHintDismissed(id: OnboardingHintId): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return localStorage.getItem(hintKey(id)) === "true";
}

export function dismissOnboardingHint(id: OnboardingHintId): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(hintKey(id), "true");
}
