"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { useSystemTheme } from "@/components/providers/system-theme-provider";
import { useUnits } from "@/components/providers/units-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  downloadCampReadyBackup,
  validateCampReadyBackup,
} from "@/lib/app-backup";
import {
  APP_VERSION,
  DEVELOPER_NAME,
  IS_PRIME_TEST_LAB_BUILD,
} from "@/lib/build-config";
import { readDatabaseSync, writeDatabaseSync } from "@/lib/storage";
import { clearUiSessionState } from "@/lib/storage/ui-session-state";
import type { AppTheme } from "@/lib/theme/system-theme";
import type { AppUnits } from "@/lib/units";
import type { CampReadyDatabase } from "@/types";
import {
  ArrowLeft,
  Download,
  Lock,
  Moon,
  Ruler,
  Scale,
  Settings,
  Sun,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

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

const UNITS_OPTIONS: {
  id: AppUnits;
  label: string;
  description: string;
  icon: typeof Scale;
}[] = [
  {
    id: "imperial",
    label: "Imperial",
    description: "Pounds, Fahrenheit, and miles per hour.",
    icon: Scale,
  },
  {
    id: "metric",
    label: "Metric",
    description: "Kilograms, Celsius, and kilometers per hour.",
    icon: Ruler,
  },
];

function SettingsHeader() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link
        href="/"
        aria-label="Back to CampSync"
        className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-muted active:opacity-90"
      >
        <ArrowLeft className="size-6" strokeWidth={2.25} aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight text-foreground">Settings</p>
        <p className="truncate text-sm font-medium text-muted">
          Theme, units, payload, backups, and app details
        </p>
      </div>
      <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Settings className="size-6" strokeWidth={2.25} aria-hidden />
      </div>
    </div>
  );
}

function VehiclePayloadSettingsSection() {
  const { database, updateVehiclePayloadSettings } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const capacityInputId = useId();
  const alarmEnabled = database.vehiclePayload?.alarmEnabled === true;
  const storedCapacity = database.vehiclePayload?.maxPayloadCapacityLbs;
  const [capacityDraft, setCapacityDraft] = useState(
    typeof storedCapacity === "number" && storedCapacity > 0
      ? String(storedCapacity)
      : "",
  );
  const [capacityError, setCapacityError] = useState<string | null>(null);

  useEffect(() => {
    setCapacityDraft(
      typeof storedCapacity === "number" && storedCapacity > 0
        ? String(storedCapacity)
        : "",
    );
  }, [storedCapacity]);

  const commitCapacity = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setCapacityError("Enter a max payload capacity greater than 0.");
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setCapacityError("Enter a valid capacity greater than 0 lbs.");
      return;
    }

    setCapacityError(null);
    updateVehiclePayloadSettings({ maxPayloadCapacityLbs: numeric });
  };

  return (
    <section className="rounded-xl border-2 border-border bg-surface p-4">
      <h2 className="text-base font-bold text-foreground">
        Vehicle Payload Management
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Track packed gear weight against your vehicle&apos;s max payload capacity.
      </p>

      {!isPro ? (
        <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Lock className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                CampSync Pro feature
              </p>
              <p className="mt-1 text-xs leading-snug text-muted">
                Unlock payload alarms and dashboard capacity monitoring.
              </p>
              <button
                type="button"
                onClick={openPaywall}
                className="touch-target mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-teal-500 px-3 py-2 text-xs font-bold text-zinc-950 active:opacity-90"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={alarmEnabled}
            onClick={() =>
              updateVehiclePayloadSettings({ alarmEnabled: !alarmEnabled })
            }
            className={`touch-target flex items-center gap-3 rounded-xl border-2 p-3 text-left active:opacity-90 ${
              alarmEnabled
                ? "border-accent bg-accent/15"
                : "border-border bg-background"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-foreground">
                Enable Vehicle Payload Alarm
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">
                Show a payload summary on the dashboard for the selected trip.
              </span>
            </span>
            <span
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors ${
                alarmEnabled
                  ? "border-accent bg-accent"
                  : "border-border bg-surface"
              }`}
              aria-hidden
            >
              <span
                className={`inline-block size-5 rounded-full bg-foreground transition-transform ${
                  alarmEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {alarmEnabled ? (
            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <label
                htmlFor={capacityInputId}
                className="flex flex-col gap-1.5"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Max Payload Capacity (lbs)
                </span>
                <input
                  id={capacityInputId}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={capacityDraft}
                  onChange={(event) => {
                    setCapacityDraft(event.target.value);
                    if (capacityError) setCapacityError(null);
                  }}
                  onBlur={() => commitCapacity(capacityDraft)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="e.g. 1200"
                  className="touch-target rounded-xl border-2 border-border bg-surface px-3 text-base font-semibold text-foreground"
                />
              </label>
              <p className="mt-2 text-xs leading-snug text-muted">
                Max vehicle payload weight + weights of all passengers, vehicle
                armor, winch, etc.
              </p>
              {capacityError ? (
                <p
                  role="alert"
                  className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  {capacityError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MealPrepSettingsSection() {
  const { database, updateMealPrepSettings } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const enabled = database.mealPrep?.enabled === true;

  return (
    <section className="rounded-xl border-2 border-border bg-surface p-4">
      <h2 className="text-base font-bold text-foreground">Meal Prep</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Plan food by trip day, track what&apos;s consumed, and keep recipe notes
        handy at camp.
      </p>

      {!isPro ? (
        <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Lock className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                CampSync Pro feature
              </p>
              <p className="mt-1 text-xs leading-snug text-muted">
                Unlock Meal Prep in navigation and trip day meal planning.
              </p>
              <button
                type="button"
                onClick={openPaywall}
                className="touch-target mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-teal-500 px-3 py-2 text-xs font-bold text-zinc-950 active:opacity-90"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => updateMealPrepSettings({ enabled: !enabled })}
          className={`touch-target mt-4 flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left active:opacity-90 ${
            enabled
              ? "border-accent bg-accent/15"
              : "border-border bg-background"
          }`}
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <UtensilsCrossed className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-foreground">
              Enable Meal Prep
            </span>
            <span className="mt-0.5 block text-sm leading-snug text-muted">
              Show Meal Prep in the bottom navigation and desktop trip tools.
            </span>
          </span>
          <span
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors ${
              enabled
                ? "border-accent bg-accent"
                : "border-border bg-surface"
            }`}
            aria-hidden
          >
            <span
              className={`inline-block size-5 rounded-full bg-foreground transition-transform ${
                enabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      )}
    </section>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useSystemTheme();
  const { units, setUnits } = useUnits();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{
    database: CampReadyDatabase;
    repairCount: number;
  } | null>(null);

  const handleDownloadBackup = async () => {
    const saved = await downloadCampReadyBackup(readDatabaseSync());
    setBackupStatus(
      saved
        ? {
            type: "success",
            message: "Backup ready to save or share.",
          }
        : {
            type: "error",
            message: "Could not create a backup file.",
          },
    );
  };

  const handleRestoreFile = async (file: File) => {
    setBackupStatus(null);

    try {
      const result = validateCampReadyBackup(await file.text());
      if (!result.ok) {
        setBackupStatus({ type: "error", message: result.message });
        return;
      }

      setPendingRestore({
        database: result.database,
        repairCount: result.repairCount,
      });
    } catch {
      setBackupStatus({
        type: "error",
        message: "Could not read the selected backup file.",
      });
    }
  };

  const confirmRestore = () => {
    if (!pendingRestore) return;

    clearUiSessionState();
    writeDatabaseSync(pendingRestore.database);
    setBackupStatus({
      type: "success",
      message:
        pendingRestore.repairCount > 0
          ? "Backup restored with minor repairs."
          : "Backup restored.",
    });
    setPendingRestore(null);
  };

  return (
    <MobileShell header={<SettingsHeader />}>
      <div className="flex flex-col gap-5 py-4 pb-8">
        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h1 className="text-xl font-black text-foreground">App Settings</h1>
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
          <h2 className="text-base font-bold text-foreground">Units</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Choose how weight, temperature, and wind speed appear in the app.
          </p>
          <div className="mt-4 grid gap-3">
            {UNITS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = units === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setUnits(option.id)}
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

        <VehiclePayloadSettingsSection />

        <MealPrepSettingsSection />

        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h2 className="text-base font-bold text-foreground">Backup & Restore</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Save all trips, dates, locations, pack status, and reusable gear inventories
            to a CampSync backup JSON file for moving phones or keeping a copy.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDownloadBackup()}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground active:opacity-90"
            >
              <Download className="size-5" strokeWidth={2.25} aria-hidden />
              Download Backup
            </button>
            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-bold text-foreground active:opacity-90"
            >
              <Upload className="size-5" strokeWidth={2.25} aria-hidden />
              Restore Backup
            </button>
          </div>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,text/plain,.json,.campsync,.campready,*/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void handleRestoreFile(file);
              }
            }}
          />
          {backupStatus ? (
            <p
              role="status"
              className={`mt-3 text-sm font-semibold ${
                backupStatus.type === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted"
              }`}
            >
              {backupStatus.message}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Restoring a backup replaces the data currently stored on this device.
          </p>
        </section>

        <section className="rounded-xl border-2 border-border bg-surface p-4">
          <h2 className="text-base font-bold text-foreground">About CampSync</h2>
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
      <ConfirmDialog
        open={pendingRestore !== null}
        title="Restore backup?"
        message="This will replace the trips and gear inventories currently stored on this device."
        confirmLabel="Restore Backup"
        cancelLabel="Keep Current Data"
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestore(null)}
      />
    </MobileShell>
  );
}
