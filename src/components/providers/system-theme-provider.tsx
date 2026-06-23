"use client";

import {
  applyTheme,
  getStoredTheme,
  storeTheme,
  THEME_ATTR,
  type AppTheme,
} from "@/lib/theme/system-theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SystemThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const SystemThemeContext = createContext<SystemThemeContextValue | null>(null);

function rootMatchesTheme(theme: AppTheme): boolean {
  const root = document.documentElement;
  const oppositeTheme: AppTheme = theme === "dark" ? "light" : "dark";
  return (
    root.getAttribute(THEME_ATTR) === theme &&
    root.classList.contains(theme) &&
    !root.classList.contains(oppositeTheme)
  );
}

export function SystemThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<AppTheme>(() => getStoredTheme());

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    storeTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    const enforce = () => applyTheme(getStoredTheme());

    const observer = new MutationObserver(() => {
      if (!rootMatchesTheme(getStoredTheme())) {
        enforce();
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
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <SystemThemeContext.Provider value={value}>
      {children}
    </SystemThemeContext.Provider>
  );
}

export function useSystemTheme(): SystemThemeContextValue {
  const context = useContext(SystemThemeContext);
  if (!context) {
    throw new Error("useSystemTheme must be used within SystemThemeProvider");
  }
  return context;
}
