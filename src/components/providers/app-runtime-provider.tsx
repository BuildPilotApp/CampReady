"use client";

import { initAppPowerMode } from "@/lib/runtime/app-power-mode";
import { flushPendingIndexedDBMirror } from "@/lib/storage/database";
import { flushUiSessionState } from "@/lib/storage/ui-session-state";
import { useEffect } from "react";

/** Boots runtime listeners for power-aware deferral and end-of-session flushes. */
export function AppRuntimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanupPowerMode = initAppPowerMode();

    const flushDeferred = () => {
      flushUiSessionState();
      flushPendingIndexedDBMirror();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushDeferred();
      }
    };

    window.addEventListener("pagehide", flushDeferred);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cleanupPowerMode();
      window.removeEventListener("pagehide", flushDeferred);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return children;
}
