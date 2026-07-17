"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import {
  formatImportMergeSummary,
  validateChecklistImportFile,
} from "@/lib/import-checklist";
import { CHECKLIST_ACTION_BUTTON_CLASS } from "@/components/checklist/checklist-action-button-styles";
import { Check, ChevronDown, Lock, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface ImportListStatus {
  type: "success" | "error";
  message: string;
}

interface ImportListButtonProps {
  tripId?: string | null;
  className?: string;
  onStatusChange?: (status: ImportListStatus | null) => void;
}

type ImportState = "idle" | "success" | "error";

export function ImportListButton({
  tripId,
  className = "",
  onStatusChange,
}: ImportListButtonProps) {
  const { activeTrip, importChecklistIntoTrip } = useCampReady();
  const { isProEntitled, openPaywall } = usePro();
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
    if (!isProEntitled) {
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
      const validation = await validateChecklistImportFile(file);

      if (!validation.ok) {
        const firstError = validation.errors[0];
        reportStatus({
          type: "error",
          message: firstError?.message ?? "Import file is invalid.",
        });
        return;
      }

      const result = importChecklistIntoTrip(
        targetTripId,
        validation.data.categories,
        validation.data.mealItems,
      );
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

  const showProLock = !isProEntitled;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />
      <button type="button" onClick={handleClick} className={CHECKLIST_ACTION_BUTTON_CLASS}>
        {state === "success" ? (
          <Check className="size-4 shrink-0 text-accent" aria-hidden />
        ) : (
          <Upload className="size-4 shrink-0 text-accent" aria-hidden />
        )}
        <span className="truncate">{label}</span>
        {showProLock ? (
          <Lock className="size-3.5 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 opacity-0" aria-hidden />
        )}
      </button>
    </div>
  );
}
