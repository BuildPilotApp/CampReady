/** Dark palette tokens shared by class and media-query selectors. */
export const DARK_THEME_CLASS = "dark";
export const DARK_THEME_ATTR = "data-theme";
export const DARK_THEME_ATTR_VALUE = "dark";

/** Inline JS shared by the init script and native WebView injection. */
export const FORCE_DARK_THEME_JS = `(function(){try{var r=document.documentElement;r.classList.add("dark");r.classList.remove("light");r.setAttribute("data-theme","dark");r.style.colorScheme="dark";if(document.body){document.body.style.colorScheme="dark";}}catch(e){}})();`;

export const FORCE_DARK_THEME_INIT_SCRIPT = FORCE_DARK_THEME_JS;

/** Always apply the root dark markers — app is dark-only on every platform. */
export function forceDarkThemeClass(): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.add(DARK_THEME_CLASS);
  root.classList.remove("light");
  root.setAttribute(DARK_THEME_ATTR, DARK_THEME_ATTR_VALUE);
  root.style.colorScheme = "dark";

  if (document.body) {
    document.body.style.colorScheme = "dark";
  }
}
