import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

export type OpenExternalUrlResult =
  | { ok: true }
  | { ok: false; message: string };

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Validates that a URL uses an allowed http(s) scheme. */
export function isAllowedExternalUrl(url: string): boolean {
  if (!url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/** Opens a URL in the system browser (native) or a new tab (web). */
export async function openExternalUrl(url: string): Promise<OpenExternalUrlResult> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Links are unavailable in this environment." };
  }

  if (!isAllowedExternalUrl(url)) {
    return { ok: false, message: "That link is not valid or supported." };
  }

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return { ok: true };
    }

    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      return { ok: false, message: "Could not open the link. Check your popup settings." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Could not open the link. Try again in a moment." };
  }
}
