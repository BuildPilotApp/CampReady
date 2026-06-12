"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import {
  formatImportMergeSummary,
  validateChecklistImport,
} from "@/lib/import-checklist";
import { Check, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface ImportListStatus {
  type: "success" | "error";
  message: string;
}

interface ImportListButtonProps {
  tripId?: string | null;
  onStatusChange?: (status: ImportListStatus | null) => void;
}

type ImportState = "idle" | "success" | "error";

export function ImportListButton({
  tripId,
  onStatusChange,
}: ImportListButtonProps) {
  const { activeTrip, importChecklistIntoTrip } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");

  const targetTripId = tripId ?? activeTrip?.id ?? null;

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => {
      setState("idle");
      onStatusChange?.(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [state, onStatusChange]);

  const reportStatus = (next: ImportListStatus) => {
    setState(next.type);
    onStatusChange?.(next);
  };

  const handleClick = () => {
    if (!isPro) {
      openPaywall();
      return;
    }

    if (!targetTripId) {
      reportStatus({
        type: "error",
        message: "Select or create a trip first.",
      });
      return;
    }

    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !targetTripId) {
      return;
    }

    try {
      const content = await file.text();
      const validation = validateChecklistImport(content, file.name);

      if (!validation.ok) {
        const firstError = validation.errors[0];
        reportStatus({
          type: "error",
          message: firstError?.message ?? "Import file is invalid.",
        });
        return;
      }

      const result = importChecklistIntoTrip(targetTripId, validation.data.categories);
      if (!result) {
        reportStatus({
          type: "error",
          message: "Could not import into the selected trip.",
        });
        return;
      }

      reportStatus({
        type: "success",
        message: formatImportMergeSummary(result),
      });
    } catch {
      reportStatus({
        type: "error",
        message: "Could not read the selected file.",
      });
    }
  };

  const label =
    state === "success" ? "Imported" : state === "error" ? "Import failed" : "Import List";

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />
      <button
        type="button"
        onClick={handleClick}
        className="touch-target inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border-2 border-border bg-surface px-3 text-xs font-bold text-foreground active:opacity-90"
      >
        {state === "success" ? (
          <Check className="size-4 shrink-0 text-accent" aria-hidden />
        ) : (
          <Upload className="size-4 shrink-0 text-accent" aria-hidden />
        )}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    </>
  );
}
