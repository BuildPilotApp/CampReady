"use client";

import { useGlobalNotifications } from "@/components/providers/global-notification-provider";
import { HardDrive } from "lucide-react";

export function StorageLimitBanner() {
  const { storageLimitReached } = useGlobalNotifications();

  if (!storageLimitReached) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-b border-red-500/30 bg-red-950/35 px-4 py-2.5 mobile-safe-x"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <HardDrive className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-foreground sm:text-sm">
          Storage limit reached. Changes may not save offline.
        </p>
      </div>
    </div>
  );
}
