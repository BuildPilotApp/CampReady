"use client";

import { hydrateDatabase } from "@/lib/storage";
import { useEffect } from "react";

/**
 * Ensures localforage and localStorage stay in sync on first client paint.
 * Renders nothing; safe to wrap the entire app shell.
 */
export function StorageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateDatabase().catch(() => {
      // Hydration errors are handled by CampReadyProvider.
    });
  }, []);

  return children;
}
