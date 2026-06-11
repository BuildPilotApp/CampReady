import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/** Opens a URL in the system browser (native) or a new tab (web). */
export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
