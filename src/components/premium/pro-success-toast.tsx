"use client";

import { Check, X } from "lucide-react";

interface ProSuccessToastProps {
  onDismiss: () => void;
}

export function ProSuccessToast({ onDismiss }: ProSuccessToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div className="flex w-full max-w-[var(--mobile-max-width)] items-start gap-3 rounded-2xl border border-teal-500/40 bg-zinc-950 px-4 py-3 shadow-xl shadow-black/40">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
          <Check className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-zinc-100">
          Welcome to CampReady Pro! Your lifetime access has been successfully
          unlocked.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-900 active:text-zinc-300"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
