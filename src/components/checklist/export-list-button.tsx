"use client";

import { CHECKLIST_ACTION_BUTTON_CLASS } from "@/components/checklist/checklist-action-button-styles";
import {
  copyChecklistText,
  downloadChecklistCsv,
  downloadGearInventoryCsvTemplate,
} from "@/lib/export-checklist";
import type { TripRecord } from "@/types";
import { Check, ChevronDown, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExportListButtonProps {
  trip?: TripRecord | null;
  className?: string;
}

type ExportFeedback = {
  type: "success" | "error";
  message: string;
};

const EXPORT_MENU_ITEM_CLASS =
  "touch-target flex min-h-12 w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background";

const EXPORT_MENU_ICON_CLASS = "size-4 shrink-0 text-accent";

export function ExportListButton({ trip, className = "" }: ExportListButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasListItems = trip?.categories.some(
    (category) => category.items.length > 0,
  ) ?? false;
  const label = copied
    ? "Copied"
    : hasListItems
      ? "Export List"
      : "Download Template";

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
    setOpen((current) => !current);
  };

  const handleCopyText = async () => {
    if (!trip) return;

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
    if (!trip) return;

    const saved = await downloadChecklistCsv(trip);
    setFeedback(
      saved || !hasListItems
        ? null
        : {
            type: "error",
            message: "Could not download CSV file.",
          },
    );
    setOpen(false);
  };

  const handleDownloadCsvTemplate = async () => {
    const saved = await downloadGearInventoryCsvTemplate();
    setFeedback(
      saved
        ? null
        : {
            type: "error",
            message: "Could not download CSV template.",
          },
    );
    setOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className={`relative isolate min-w-0 ${open ? "z-50" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        onClick={handleToggle}
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
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {feedback ? (
        <p
          id="export-list-feedback"
          role="status"
          className={`absolute right-0 top-full z-50 mt-1 max-w-52 text-right text-xs font-semibold leading-snug ${
            feedback.type === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-muted"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border-2 border-border bg-surface shadow-lg shadow-black/30"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {hasListItems ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleCopyText()}
                className={EXPORT_MENU_ITEM_CLASS}
              >
                <FileText className={EXPORT_MENU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                Copy as text
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleDownloadCsv()}
                className={`${EXPORT_MENU_ITEM_CLASS} border-t border-border`}
              >
                <Download className={EXPORT_MENU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                Download CSV
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground">Start with a clean template</p>
                <p className="mt-1 text-xs leading-snug text-muted">
                  Use these professionally formatted files to build your first gear inventory.
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleDownloadCsvTemplate()}
                className={EXPORT_MENU_ITEM_CLASS}
              >
                <Download className={EXPORT_MENU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                Blank CSV Template
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
