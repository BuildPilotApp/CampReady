/** Dark palette tokens shared by class and media-query selectors. */
export const DARK_THEME_CLASS = "dark";

/**
 * Android System WebView reports `prefers-color-scheme: no-preference` even when
 * the device is in dark mode. Capacitor's WebView user agent includes `; wv)`.
 */
export function isAndroidSystemWebView(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent) && /;\s*wv\)/.test(navigator.userAgent);
}

export function prefersDarkColorScheme(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Sync the `dark` class from `prefers-color-scheme` (web + iOS). */
export function syncSystemThemeClass(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (isAndroidSystemWebView()) {
    return;
  }

  document.documentElement.classList.toggle(
    DARK_THEME_CLASS,
    prefersDarkColorScheme(),
  );
}

export const SYSTEM_THEME_INIT_SCRIPT = `(()=>{try{if(/Android/i.test(navigator.userAgent)&&/;\\s*wv\\)/.test(navigator.userAgent))return;var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
