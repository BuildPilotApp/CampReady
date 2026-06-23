"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { useSystemTheme } from "@/components/providers/system-theme-provider";
import {
  APP_VERSION,
  DEVELOPER_NAME,
  IS_PRIME_TEST_LAB_BUILD,
} from "@/lib/build-config";
import type { AppTheme } from "@/lib/theme/system-theme";
import { ArrowLeft, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";

const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  description: string;
  icon: typeof Moon;
}[] = [
  {
    id: "dark",
    label: "Dark",
    description: "Low-glare palette for night packing and camp use.",
    icon: Moon,
  },
  {
    id: "light",
    label: "Light",
    description: "Higher contrast on bright screens and daylight checks.",
    icon: Sun,
  },
];

function SettingsHeader() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link
        href="/"
        aria-label="Back to CampReady"
        className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-muted active:opacity-90"
      >
        <ArrowLeft className="size-6" strokeWidth={2.25} aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight text-foreground">Settings</p>
        <p className="truncate text-sm font-medium text-muted">
          Theme and app details
        </p>
      </div>
      <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Settings className="size-6" strokeWidth={2.25} aria-hidden />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useSystemTheme();

  return (
    <MobileShell header={<SettingsHeader />}>
      <div className="flex flex-col gap-5 py-4 pb-8">
        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h1 className="text-xl font-black text-foreground">App Settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Keep shared app preferences here so they stay independent from trip
            and checklist data.
          </p>
        </section>

        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h2 className="text-base font-bold text-foreground">Theme</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Choose the display mode for this device.
          </p>
          <div className="mt-4 grid gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={selected}
                  className={`touch-target flex items-center gap-3 rounded-xl border-2 p-3 text-left active:opacity-90 ${
                    selected
                      ? "border-accent bg-accent/15"
                      : "border-border bg-background"
                  }`}
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
                    <Icon className="size-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">
                      {option.description}
                    </span>
                  </span>
                  <span
                    className={`size-4 shrink-0 rounded-full border-2 ${
                      selected ? "border-accent bg-accent" : "border-border"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h2 className="text-base font-bold text-foreground">About CampReady</h2>
          <dl className="mt-4 grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2.5">
              <dt className="text-sm font-semibold text-muted">Version</dt>
              <dd className="text-sm font-bold text-foreground">{APP_VERSION}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2.5">
              <dt className="text-sm font-semibold text-muted">Build</dt>
              <dd className="text-sm font-bold text-foreground">
                {IS_PRIME_TEST_LAB_BUILD ? "Play Store test" : "Production"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2.5">
              <dt className="text-sm font-semibold text-muted">Developer</dt>
              <dd className="text-right text-sm font-bold text-foreground">
                {DEVELOPER_NAME}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </MobileShell>
  );
}
