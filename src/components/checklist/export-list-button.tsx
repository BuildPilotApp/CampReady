"use client";

import { usePro } from "@/components/providers/pro-provider";
import {
  copyChecklistText,
  downloadChecklistCsv,
} from "@/lib/export-checklist";
import type { TripRecord } from "@/types";
import { Check, ChevronDown, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExportListButtonProps {
  trip: TripRecord;
}

export function ExportListButton({ trip }: ExportListButtonProps) {
  const { isPro, openPaywall } = usePro();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasItems = trip.categories.some(
    (category) => category.items.length > 0,
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleToggle = () => {
    if (!isPro) {
      openPaywall();
      return;
    }
    setOpen((current) => !current);
  };

  const handleCopyText = async () => {
    await copyChecklistText(trip);
    setCopied(true);
    setOpen(false);
  };

  const handleDownloadCsv = () => {
    downloadChecklistCsv(trip);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!hasItems}
        aria-expanded={open}
        aria-haspopup="menu"
        className="touch-target inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-surface px-3 py-2 text-xs font-bold text-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? (
          <Check className="size-4 text-accent" aria-hidden />
        ) : (
          <Download className="size-4 text-accent" aria-hidden />
        )}
        {copied ? "Copied" : "Export List"}
        {isPro && hasItems ? (
          <ChevronDown
            className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        ) : null}
      </button>

      {open && isPro ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border-2 border-border bg-surface shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleCopyText()}
            className="touch-target flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <FileText className="size-4 shrink-0 text-accent" aria-hidden />
            Copy as text
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadCsv}
            className="touch-target flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <Download className="size-4 shrink-0 text-accent" aria-hidden />
            Download CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}
