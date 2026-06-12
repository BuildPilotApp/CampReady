"use client";

import { useGlobalNotifications } from "@/components/providers/global-notification-provider";
import { FileWarning, X } from "lucide-react";

export function ImportValidationBanner() {
  const { importValidationMessage, dismissImportValidationMessage } =
    useGlobalNotifications();

  if (!importValidationMessage) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-b border-orange-500/30 bg-orange-950/35 px-4 py-2.5 mobile-safe-x"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
          <FileWarning className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {importValidationMessage}
        </p>
        <button
          type="button"
          onClick={dismissImportValidationMessage}
          aria-label="Dismiss import warning"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface active:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
