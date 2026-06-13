"use client";

import { dismissWelcome, WELCOME_STEPS } from "@/lib/onboarding";
import { X } from "lucide-react";

interface WelcomeGuideProps {
  onDismiss: () => void;
}

export function WelcomeGuide({ onDismiss }: WelcomeGuideProps) {
  const handleDismiss = () => {
    dismissWelcome();
    onDismiss();
  };

  return (
    <section
      aria-labelledby="welcome-guide-title"
      className="rounded-xl border-2 border-accent/30 bg-surface px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            id="welcome-guide-title"
            className="text-base font-bold text-foreground"
          >
            Welcome to CampReady
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Three steps to your first packed trip:
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {WELCOME_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent"
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={handleDismiss}
            className="touch-target mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground active:opacity-90"
          >
            Got it
          </button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss welcome guide"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted active:bg-background active:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
