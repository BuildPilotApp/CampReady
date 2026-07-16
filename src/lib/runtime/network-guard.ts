import { getPowerPolicy } from "@/lib/runtime/app-power-mode";

/** True when the browser reports connectivity (best-effort; may be optimistic). */
export function isNetworkAvailable(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return navigator.onLine;
}

/** Gate optional network fetches; false when offline or app is backgrounded. */
export function shouldAttemptNetworkFetch(): boolean {
  if (!isNetworkAvailable()) {
    return false;
  }
  return !getPowerPolicy().deferNetwork;
}
