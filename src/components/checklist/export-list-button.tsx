"use client";

import {
  copyChecklistText,
  downloadChecklistCsv,
  downloadChecklistJson,
} from "@/lib/export-checklist";
import type { TripRecord } from "@/types";
import { Braces, Check, ChevronDown, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExportListButtonProps {
  trip: TripRecord;
}

export function ExportListButton({ trip }: ExportListButtonProps) {
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
    if (!hasItems) return;
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

  const handleDownloadJson = () => {
    downloadChecklistJson(trip);
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
        className="touch-target inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-border bg-surface px-3 text-xs font-bold text-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? (
          <Check className="size-4 shrink-0 text-accent" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0 text-accent" aria-hidden />
        )}
        <span className="whitespace-nowrap">{copied ? "Copied" : "Export List"}</span>
        {hasItems ? (
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        ) : null}
      </button>

      {open && hasItems ? (
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
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadJson}
            className="touch-target flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-foreground active:bg-background"
          >
            <Braces className="size-4 shrink-0 text-accent" aria-hidden />
            Download JSON
          </button>
        </div>
      ) : null}
    </div>
  );
}
