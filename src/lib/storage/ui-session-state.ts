import type { AppTab, ChecklistFilter } from "@/types";
import { getPowerPolicy } from "@/lib/runtime/app-power-mode";

export const UI_SESSION_STORAGE_KEY = "campready:ui-session";
const UI_SESSION_DEBOUNCE_MS = 500;

export interface UiSessionState {
  activeTab?: AppTab;
  checklistFilter?: ChecklistFilter;
  collapsedCategories?: Record<string, boolean>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isAppTab(value: unknown): value is AppTab {
  return value === "dashboard" || value === "checklist";
}

function isChecklistFilter(value: unknown): value is ChecklistFilter {
  return value === "all" || value === "remaining";
}

function normalizeCollapsedCategories(
  value: unknown,
): Record<string, boolean> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record: Record<string, boolean> = {};
  for (const [key, collapsed] of Object.entries(value)) {
    if (typeof key === "string" && typeof collapsed === "boolean") {
      record[key] = collapsed;
    }
  }

  return Object.keys(record).length > 0 ? record : undefined;
}

export function readUiSessionState(): UiSessionState {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(UI_SESSION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const state: UiSessionState = {};

    if (isAppTab(record.activeTab)) {
      state.activeTab = record.activeTab;
    }

    if (isChecklistFilter(record.checklistFilter)) {
      state.checklistFilter = record.checklistFilter;
    }

    const collapsed = normalizeCollapsedCategories(record.collapsedCategories);
    if (collapsed) {
      state.collapsedCategories = collapsed;
    }

    return state;
  } catch {
    return {};
  }
}

export function writeUiSessionState(state: UiSessionState): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.setItem(UI_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Session UI state is best-effort; defaults remain usable.
  }
}

let pendingUiSessionState: UiSessionState | null = null;
let uiSessionWriteTimer: number | null = null;

function clearUiSessionWriteTimer(): void {
  if (uiSessionWriteTimer) {
    window.clearTimeout(uiSessionWriteTimer);
    uiSessionWriteTimer = null;
  }
}

/** Debounced UI session write — skipped while the app is backgrounded. */
export function scheduleWriteUiSessionState(state: UiSessionState): void {
  if (!isBrowser()) {
    return;
  }

  pendingUiSessionState = state;

  if (getPowerPolicy().deferNonCriticalWrites) {
    clearUiSessionWriteTimer();
    return;
  }

  clearUiSessionWriteTimer();
  const delay = UI_SESSION_DEBOUNCE_MS * getPowerPolicy().debounceMultiplier;
  uiSessionWriteTimer = window.setTimeout(() => {
    uiSessionWriteTimer = null;
    flushUiSessionState();
  }, delay);
}

/** Immediately persist any queued UI session state. */
export function flushUiSessionState(): void {
  clearUiSessionWriteTimer();
  if (!pendingUiSessionState) {
    return;
  }

  writeUiSessionState(pendingUiSessionState);
  pendingUiSessionState = null;
}

export function clearUiSessionState(): void {
  clearUiSessionWriteTimer();
  pendingUiSessionState = null;

  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(UI_SESSION_STORAGE_KEY);
  } catch {
    // Best-effort clear.
  }
}
