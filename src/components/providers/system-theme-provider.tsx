"use client";

import {
  DARK_THEME_CLASS,
  forceDarkThemeClass,
} from "@/lib/theme/system-theme";
import { useEffect } from "react";

/**
 * Keeps dark markers on <html> after hydration and re-applies them if a
 * WebView or OEM skin strips the class (common on Samsung, Xiaomi, etc.).
 */
export function SystemThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    forceDarkThemeClass();

    const enforce = () => forceDarkThemeClass();

    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains(DARK_THEME_CLASS)) {
        forceDarkThemeClass();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("pageshow", enforce);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        enforce();
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("pageshow", enforce);
    };
  }, []);

  return children;
}
