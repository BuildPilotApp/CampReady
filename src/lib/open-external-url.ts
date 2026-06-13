import {
  canLaunchSystemUrl,
  isNativePlatform,
  launchSystemUrl,
} from "@/lib/system-url-launcher";

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

export function isAmazonHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return hostname === "amazon.com" || hostname.endsWith(".amazon.com");
  } catch {
    return false;
  }
}

/**
 * Opens affiliate shopping links via the OS URL handler on native devices so
 * installed apps (Amazon) can intercept standard https links, with the system
 * browser as fallback when no app is available.
 */
export async function openAffiliateUrl(url: string): Promise<OpenExternalUrlResult> {
  if (!canLaunchSystemUrl()) {
    return { ok: false, message: "Links are unavailable in this environment." };
  }

  if (!isAllowedExternalUrl(url)) {
    return { ok: false, message: "That link is not valid or supported." };
  }

  if (!isAmazonHttpsUrl(url)) {
    return { ok: false, message: "That shopping link is not supported." };
  }

  try {
    await launchSystemUrl(url);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not open the link. Try again in a moment." };
  }
}

/** Opens a generic external URL in a new browser tab (web) or via the OS handler (native). */
export async function openExternalUrl(url: string): Promise<OpenExternalUrlResult> {
  if (!canLaunchSystemUrl()) {
    return { ok: false, message: "Links are unavailable in this environment." };
  }

  if (!isAllowedExternalUrl(url)) {
    return { ok: false, message: "That link is not valid or supported." };
  }

  try {
    if (isNativePlatform()) {
      await launchSystemUrl(url);
    } else {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        return { ok: false, message: "Could not open the link. Check your popup settings." };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Could not open the link. Try again in a moment." };
  }
}
