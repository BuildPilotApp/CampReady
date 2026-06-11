"use client";

import {
  isAndroidSystemWebView,
  syncSystemThemeClass,
} from "@/lib/theme/system-theme";
import { useEffect } from "react";

/**
 * Keeps the root `dark` class aligned with the OS theme on web and iOS.
 * Android Capacitor WebView is synced from MainActivity because matchMedia is unreliable there.
 */
export function SystemThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (isAndroidSystemWebView()) {
      return;
    }

    syncSystemThemeClass();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => syncSystemThemeClass();

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return children;
}
