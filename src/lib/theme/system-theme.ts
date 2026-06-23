export type AppTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "campready:theme";
export const THEME_ATTR = "data-theme";

export function isAppTheme(value: string | null): value is AppTheme {
  return value === "dark" || value === "light";
}

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isAppTheme(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
}

/** Inline JS avoids a flash of the wrong palette before React hydrates. */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="dark";}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.classList.toggle("light",t==="light");r.setAttribute("${THEME_ATTR}",t);r.style.colorScheme=t;if(document.body){document.body.style.colorScheme=t;}}catch(e){}})();`;

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.setAttribute(THEME_ATTR, theme);
  root.style.colorScheme = theme;

  if (document.body) {
    document.body.style.colorScheme = theme;
  }
}

export function storeTheme(theme: AppTheme): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme stays applied in memory for the current session.
  }
}
