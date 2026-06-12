import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function prefersMobileWebShare(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function shareDownloadFile(
  blob: Blob,
  filename: string,
  mimeType: string,
): Promise<boolean> {
  if (typeof File === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  try {
    const file = new File([blob], filename, { type: mimeType });
    const shareData: ShareData = {
      files: [file],
      title: filename,
    };

    if (navigator.canShare && !navigator.canShare(shareData)) {
      return false;
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}

function anchorDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
  }, 0);
}

function dataUrlDownload(content: string, filename: string, mimeType: string): void {
  const encoded = encodeURIComponent(content);
  const dataUrl = `data:${mimeType};charset=utf-8,${encoded}`;
  anchorDownload(dataUrl, filename);
}

function isShareCanceled(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

async function downloadTextFileNative(
  content: string,
  filename: string,
): Promise<boolean> {
  try {
    const { uri } = await Filesystem.writeFile({
      path: `exports/${filename}`,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    await Share.share({
      title: filename,
      files: [uri],
      dialogTitle: `Save ${filename}`,
    });

    return true;
  } catch (error) {
    return isShareCanceled(error);
  }
}

/**
 * Saves text content as a downloadable file. Uses Capacitor Filesystem + Share on
 * native apps, the system share sheet on mobile browsers, and anchor downloads
 * on desktop web.
 */
export async function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    return downloadTextFileNative(content, filename);
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });

  if (prefersMobileWebShare()) {
    const shared = await shareDownloadFile(blob, filename, mimeType);
    if (shared) {
      return true;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    anchorDownload(objectUrl, filename);
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 2000);
    return true;
  } catch {
    URL.revokeObjectURL(objectUrl);
  }

  try {
    dataUrlDownload(content, filename, mimeType);
    return true;
  } catch {
    return false;
  }
}
