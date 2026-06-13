"use client";

import { usePro } from "@/components/providers/pro-provider";
import { STRIPE_CHECKOUT_URL } from "@/lib/pro";
import { Check, RefreshCw, Shield, Sparkles, X } from "lucide-react";
import { useState } from "react";

const FEATURES = [
  {
    icon: Check,
    title: "Unlimited trips",
    description: "Plan every weekend, season, and rig at once — no juggling.",
  },
  {
    icon: Sparkles,
    title: "Unlimited saved checklists",
    description:
      "Separate inventories for each vehicle, season, or family setup.",
  },
  {
    icon: Shield,
    title: "Import & merge pack lists",
    description:
      "Restore backups and merge CSV or JSON exports without duplicates.",
  },
] as const;

interface PaywallModalProps {
  onClose: () => void;
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  const { refreshProAccess } = usePro();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const handleRestore = () => {
    const result = refreshProAccess();
    if (result.isPro) {
      setRestoreMessage("Pro access restored on this device.");
      return;
    }

    setRestoreMessage(
      "No purchase found yet. Complete checkout in your browser, then return here and tap Restore again.",
    );
  };

  return (
    <div
      className="mobile-overlay-safe-bottom fixed inset-0 z-[60] flex items-end justify-center bg-black/70 px-0 pt-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby="paywall-title"
        aria-modal="true"
        className="max-h-[min(calc(92dvh-env(safe-area-inset-bottom,0px)-3rem),720px)] w-full max-w-[var(--mobile-max-width)] overflow-y-auto rounded-t-3xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/60 sm:max-h-[92dvh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 touch-target inline-flex size-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 active:bg-zinc-800"
          >
            <X className="size-5" aria-hidden />
          </button>

          <div className="pr-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Lifetime Pro
            </p>
            <h2
              id="paywall-title"
              className="mt-2 text-2xl font-bold leading-tight text-white"
            >
              Pack like a pro. Pay once.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              The free tier includes the full packing workflow for one trip and one
              saved checklist. Pro removes every limit — forever, on this device.
            </p>
          </div>

          <ul className="mt-6 flex flex-col gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                    <Icon className="size-4" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-zinc-100">
                      {feature.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-zinc-400">
                      {feature.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <a
            href={STRIPE_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target mt-7 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 px-4 py-4 text-center text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/20 active:opacity-90"
          >
            Upgrade — $4.99 one-time
          </a>

          <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
            Secure checkout opens in your browser. Return to CampReady afterward —
            Pro unlocks automatically on this device.
          </p>

          <button
            type="button"
            onClick={handleRestore}
            className="touch-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 active:bg-zinc-800"
          >
            <RefreshCw className="size-4" aria-hidden />
            Restore Pro access
          </button>

          {restoreMessage ? (
            <p
              role="status"
              className="mt-3 text-center text-xs font-semibold leading-snug text-teal-300"
            >
              {restoreMessage}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
