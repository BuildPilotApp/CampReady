"use client";

import { STRIPE_CHECKOUT_URL } from "@/lib/pro";
import { Check, Shield, X } from "lucide-react";

const FEATURES = [
  {
    icon: Check,
    title: "Plan Ahead",
    description: "Unlimited concurrent active trips.",
  },
  {
    icon: Shield,
    title: "Tailor Your Rig",
    description:
      "Save unlimited custom templates for every vehicle or season configuration.",
  },
  {
    icon: Shield,
    title: "Merge Pack Lists",
    description:
      "Import JSON or CSV exports to merge categories and gear into any trip without duplicates.",
  },
] as const;

interface PaywallModalProps {
  onClose: () => void;
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby="paywall-title"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-[var(--mobile-max-width)] overflow-y-auto rounded-t-3xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/60 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 active:bg-zinc-800"
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
              Unlock Lifetime Pro Access
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Never turn the truck around. Pack with absolute certainty for less
              than the cost of a bitter tasting, over-roasted corporate chain
              coffee.
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
            Upgrade Now — $4.99 (Buy Once, Own Forever)
          </a>

          <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
            One-time purchase. After checkout, return to CampReady and Pro unlocks
            automatically on this device.
          </p>
        </div>
      </section>
    </div>
  );
}
