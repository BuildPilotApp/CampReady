"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { validateChecklistImportFile } from "@/lib/import-checklist";
import { AlertTriangle, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";

export function StorageRecoveryBanner() {
  const {
    storageRecovery,
    dismissStorageRecovery,
    resetAllData,
    restoreBackupCategories,
  } = useCampReady();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  if (!storageRecovery) {
    return null;
  }

  const handleRestoreFile = async (file: File) => {
    setRestoreError(null);

    let validation;
    try {
      validation = await validateChecklistImportFile(file, {
        suppressNotification: true,
        fileSize: file.size,
      });
    } catch {
      setRestoreError("Could not read the selected file.");
      return;
    }

    if (!validation.ok) {
      setRestoreError(validation.errors[0]?.message ?? "Invalid backup file.");
      return;
    }

    const result = restoreBackupCategories(validation.data.categories);
    if (!result) {
      setRestoreError("Could not restore backup. Try again.");
      return;
    }

    dismissStorageRecovery();
  };

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-3 mobile-safe-x"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <AlertTriangle className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">
            Saved data couldn&apos;t load
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">
            {storageRecovery === "corrupt"
              ? "Your on-device storage looked damaged. You're on a fresh start. Restore a backup or keep going."
              : "Something went wrong reading storage. You're on a fresh start. Restore a backup or keep going."}
          </p>
          {restoreError ? (
            <p className="mt-2 text-xs font-medium text-red-400">{restoreError}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-foreground active:opacity-90"
            >
              <Upload className="size-3.5" aria-hidden />
              Restore backup
            </button>
            <button
              type="button"
              onClick={() => {
                resetAllData();
                dismissStorageRecovery();
              }}
              className="touch-target inline-flex items-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground active:opacity-90"
            >
              Start fresh
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissStorageRecovery}
          aria-label="Dismiss recovery notice"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface active:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void handleRestoreFile(file);
          }
        }}
      />
    </div>
  );
}
