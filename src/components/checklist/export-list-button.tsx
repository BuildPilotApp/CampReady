"use client";

import { CHECKLIST_ACTION_BUTTON_CLASS } from "@/components/checklist/checklist-action-button-styles";
import {
  copyChecklistText,
  downloadChecklistAppBackup,
  downloadChecklistCsv,
} from "@/lib/export-checklist";
import type { TripRecord } from "@/types";
import { Archive, Check, ChevronDown, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExportListButtonProps {
  trip: TripRecord;
  className?: string;
}

type ExportFeedback = {
  type: "success" | "error";
  message: string;
};

export function ExportListButton({ trip, className = "" }: ExportListButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasItems = trip.categories.some(
    (category) => category.items.length > 0,
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleToggle = () => {
    if (!hasItems) return;
    setOpen((current) => !current);
  };

  const handleCopyText = async () => {
    try {
      await copyChecklistText(trip);
      setCopied(true);
      setFeedback(null);
    } catch {
      setCopied(false);
      setFeedback({
        type: "error",
        message: "Could not copy checklist text.",
      });
    } finally {
      setOpen(false);
    }
  };

  const handleDownloadCsv = async () => {
    const saved = await downloadChecklistCsv(trip);
    setFeedback(
      saved || !hasItems
        ? null
        : {
            type: "error",
            message: "Could not download CSV file.",
          },
    );
    setOpen(false);
  };

  const handleDownloadAppBackup = async () => {
    const saved = await downloadChecklistAppBackup(trip);
    setFeedback(
      saved
        ? null
        : {
            type: "error",
            message: "Could not download app backup.",
          },
    );
    setOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative isolate min-w-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!hasItems}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-describedby={feedback ? "export-list-feedback" : undefined}
        className={CHECKLIST_ACTION_BUTTON_CLASS}
      >
        {copied ? (
          <Check className="size-4 shrink-0 text-accent" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0 text-accent" aria-hidden />
        )}
        <span className="truncate">{copied ? "Copied" : "Export List"}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted transition-transform ${
            hasItems ? (open ? "rotate-180" : "") : "opacity-0"
          }`}
          aria-hidden
        />
      </button>

      {feedback ? (
        <p
          id="export-list-feedback"
          role="status"
          className={`absolute right-0 top-full z-50 mt-1 max-w-52 text-right text-[0.65rem] font-semibold leading-snug ${
            feedback.type === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-muted"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {open && hasItems ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border-2 border-border bg-surface shadow-lg"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleCopyText()}
            className="touch-target flex min-h-11 w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <FileText className="size-4 shrink-0 text-accent" aria-hidden />
            Copy as text
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleDownloadCsv()}
            className="touch-target flex min-h-11 w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <Download className="size-4 shrink-0 text-accent" aria-hidden />
            Download CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleDownloadAppBackup()}
            className="touch-target flex min-h-11 w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <Archive className="size-4 shrink-0 text-accent" aria-hidden />
            Download App Backup
          </button>
        </div>
      ) : null}
    </div>
  );
}
