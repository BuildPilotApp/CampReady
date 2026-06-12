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

    const startObserver = () => {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    };

    const stopObserver = () => {
      observer.disconnect();
    };

    startObserver();

    window.addEventListener("pageshow", enforce);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        enforce();
        startObserver();
        return;
      }
      stopObserver();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopObserver();
      window.removeEventListener("pageshow", enforce);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return children;
}
