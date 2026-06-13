import type { CampReadyDatabase } from "@/types";
import { isEmptyDatabase } from "@/lib/storage/seed";

export const ONBOARDING_STORAGE_KEY = "campready:onboarding";

export interface OnboardingState {
  completedAt?: string;
  starterAccepted?: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readOnboardingState(): OnboardingState {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const record = parsed as Partial<OnboardingState>;
    const state: OnboardingState = {};

    if (typeof record.completedAt === "string") {
      state.completedAt = record.completedAt;
    }
    if (typeof record.starterAccepted === "boolean") {
      state.starterAccepted = record.starterAccepted;
    }

    return state;
  } catch {
    return {};
  }
}

export function markOnboardingComplete(options?: {
  starterAccepted?: boolean;
}): void {
  if (!isBrowser()) {
    return;
  }

  const state: OnboardingState = {
    completedAt: new Date().toISOString(),
    ...(options?.starterAccepted ? { starterAccepted: true } : {}),
  };

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort persistence.
  }
}

export function shouldShowOnboarding(database: CampReadyDatabase): boolean {
  if (readOnboardingState().completedAt) {
    return false;
  }

  return isEmptyDatabase(database);
}
