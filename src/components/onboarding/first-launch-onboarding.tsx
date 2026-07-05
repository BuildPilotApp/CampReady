"use client";

import {
  completeFirstLaunchOnboarding,
  FIRST_LAUNCH_ONBOARDING_STEPS,
  shouldShowFirstLaunchOnboarding,
} from "@/lib/onboarding";
import { CheckCircle2, ChevronLeft, ChevronRight, Tent } from "lucide-react";
import { useEffect, useState } from "react";

const WELCOME_OVERLAY_CLASS_NAME = "welcome-screen-overlay";
const WELCOME_PANEL_CLASS_NAME = "welcome-screen-panel";

export function FirstLaunchOnboarding() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setVisible(shouldShowFirstLaunchOnboarding());
  }, []);

  if (!visible) {
    return null;
  }

  const step = FIRST_LAUNCH_ONBOARDING_STEPS[stepIndex]!;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === FIRST_LAUNCH_ONBOARDING_STEPS.length - 1;

  const finish = () => {
    completeFirstLaunchOnboarding();
    setVisible(false);
  };

  return (
    <div
      className={`mobile-overlay-safe-bottom ${WELCOME_OVERLAY_CLASS_NAME} fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 px-4 pt-4 sm:items-center sm:p-4`}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-launch-onboarding-title"
        className={`max-h-[min(calc(85dvh-var(--safe-area-bottom)-1rem),640px)] w-full max-w-[var(--mobile-max-width)] overflow-y-auto rounded-2xl border-2 border-border bg-surface p-5 shadow-lg ${WELCOME_PANEL_CLASS_NAME}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Tent className="size-6" strokeWidth={2.25} aria-hidden />
          </div>
          <button
            type="button"
            onClick={finish}
            className="touch-target rounded-xl px-3 text-sm font-bold text-muted active:bg-background active:text-foreground"
          >
            Skip
          </button>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent">
          {step.eyebrow}
        </p>
        <h2
          id="first-launch-onboarding-title"
          className="mt-1 text-2xl font-black leading-tight text-foreground"
        >
          {step.title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">{step.body}</p>

        <ol className="mt-6 flex gap-2" aria-label="Onboarding progress">
          {FIRST_LAUNCH_ONBOARDING_STEPS.map((item, index) => {
            const selected = index === stepIndex;
            return (
              <li key={item.title} className="flex-1">
                <span
                  className={`block h-2 rounded-full ${
                    selected ? "bg-accent" : "bg-border"
                  }`}
                  aria-current={selected ? "step" : undefined}
                />
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={isFirstStep}
            className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-border bg-background px-3 text-sm font-bold text-foreground active:opacity-90 disabled:opacity-40"
          >
            <ChevronLeft className="size-5" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                finish();
                return;
              }
              setStepIndex((current) => current + 1);
            }}
            className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="size-5" aria-hidden />
                Start Packing
              </>
            ) : (
              <>
                Next
                <ChevronRight className="size-5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
