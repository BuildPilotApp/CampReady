"use client";

import { X } from "lucide-react";

interface DismissibleHintProps {
  children: React.ReactNode;
  onDismiss: () => void;
  className?: string;
}

export function DismissibleHint({
  children,
  onDismiss,
  className = "",
}: DismissibleHintProps) {
  return (
    <div
      className={`rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5 ${className}`.trim()}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">{children}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss hint"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-background active:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
