"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { markOnboardingComplete } from "@/lib/onboarding-state";
import {
  STARTER_TRIP_NAME,
  STARTER_TEMPLATE_DESCRIPTION,
  STARTER_TEMPLATE_NAME,
} from "@/lib/starter-checklist";
import { addDaysIso, todayIso } from "@/lib/date-utils";
import { ClipboardList, LayoutDashboard, Tent, X } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    title: "Welcome to CampReady",
    body: "A focused packing utility for camping and road trips. No accounts, no clutter — just trips, gear lists, and one-tap checkoff so nothing gets left behind.",
    icon: Tent,
  },
  {
    title: "Two tabs, one workflow",
    body: "Use the Dashboard to create trips, track progress, and check weather. Switch to Gear Checklist to stage and pack every item before you roll out.",
    icon: LayoutDashboard,
  },
  {
    title: "Pack with confidence",
    body: "Tap each item to advance: Needed → Staged → Packed. Category colors show what still needs attention at a glance.",
    icon: ClipboardList,
  },
] as const;

interface FirstRunGuideProps {
  onDismiss: () => void;
}

export function FirstRunGuide({ onDismiss }: FirstRunGuideProps) {
  const { loadStarterExperience } = useCampReady();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isFinalStep = step === STEPS.length;

  const finish = (options?: { starterAccepted?: boolean }) => {
    markOnboardingComplete(options);
    onDismiss();
  };

  const handleStarter = () => {
    if (submitting) return;
    setSubmitting(true);
    loadStarterExperience({
      tripName: STARTER_TRIP_NAME,
      templateName: STARTER_TEMPLATE_NAME,
      templateDescription: STARTER_TEMPLATE_DESCRIPTION,
      startDate: todayIso(),
      endDate: addDaysIso(todayIso(), 2),
    });
    finish({ starterAccepted: true });
  };

  const handleScratch = () => {
    finish();
  };

  const current = STEPS[step];
  const StepIcon = current?.icon ?? Tent;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-labelledby="first-run-title"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-[var(--mobile-max-width)] overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-2xl shadow-black/50 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          {!isFinalStep ? (
            <button
              type="button"
              onClick={() => finish()}
              aria-label="Skip introduction"
              className="absolute right-4 top-4 touch-target inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted active:bg-surface active:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}

          {!isFinalStep && current ? (
            <>
              <div className="flex items-center gap-2 pr-10">
                {STEPS.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= step ? "bg-accent" : "bg-border"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>

              <span className="mt-5 inline-flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <StepIcon className="size-6" strokeWidth={2.25} aria-hidden />
              </span>

              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2
                id="first-run-title"
                className="mt-2 text-2xl font-bold leading-tight text-foreground"
              >
                {current.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{current.body}</p>

              <button
                type="button"
                onClick={() => setStep((value) => value + 1)}
                className="touch-target mt-6 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground active:opacity-90"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Ready to pack
              </p>
              <h2
                id="first-run-title"
                className="mt-2 text-2xl font-bold leading-tight text-foreground"
              >
                How do you want to start?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Load a curated weekend camping list to see how CampReady works, or
                start with a blank trip and build your own rig from scratch. You can
                edit everything either way.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleStarter}
                  className="touch-target rounded-xl bg-accent px-4 py-3.5 text-left active:opacity-90 disabled:opacity-60"
                >
                  <span className="block text-base font-bold text-accent-foreground">
                    Load weekend camping starter
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-accent-foreground/80">
                    Trip + saved checklist with shelter, kitchen, clothing, and safety
                    essentials.
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleScratch}
                  className="touch-target rounded-xl border-2 border-border bg-background px-4 py-3.5 text-left active:opacity-90 disabled:opacity-60"
                >
                  <span className="block text-base font-bold text-foreground">
                    Start from scratch
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-muted">
                    Create your own trip and categories on the Dashboard.
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
