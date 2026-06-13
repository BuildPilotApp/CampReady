"use client";

import type { ReactNode } from "react";

interface OverlayModalProps {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}

export function OverlayModal({
  title,
  onClose,
  children,
  labelledBy,
}: OverlayModalProps) {
  const titleId = labelledBy ?? (title ? "overlay-modal-title" : undefined);

  return (
    <div
      className="mobile-overlay-safe-bottom fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 px-4 pt-4 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[min(calc(85dvh-env(safe-area-inset-bottom,0px)-1rem),640px)] w-full max-w-[var(--mobile-max-width)] overflow-y-auto rounded-2xl border-2 border-border bg-surface p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="text-lg font-bold text-foreground">
            {title}
          </h2>
        ) : null}
        {children}
      </section>
    </div>
  );
}
