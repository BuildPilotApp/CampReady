"use client";

import {
  getSelectableTemplateOptions,
  getTemplateOptionLabel,
} from "@/lib/templates";
import type { ChecklistTemplate } from "@/types";
import { ChevronDown, Layers } from "lucide-react";
import { useMemo } from "react";

interface InventoryTemplatePickerProps {
  templateId: string;
  onTemplateIdChange: (templateId: string) => void;
  savedTemplates: ChecklistTemplate[];
  hint?: string;
  footer?: React.ReactNode;
}

export function InventoryTemplatePicker({
  templateId,
  onTemplateIdChange,
  savedTemplates,
  hint,
  footer,
}: InventoryTemplatePickerProps) {
  const templateOptions = useMemo(
    () => getSelectableTemplateOptions(savedTemplates),
    [savedTemplates],
  );

  const selectedTemplateLabel = getTemplateOptionLabel(templateId, savedTemplates);

  return (
    <details className="group rounded-xl border-2 border-border bg-background">
      <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-foreground active:opacity-90">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Layers className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="truncate">
            Gear checklist
            <span className="font-semibold text-muted"> · {selectedTemplateLabel}</span>
          </span>
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
        {hint ? (
          <p className="text-sm leading-snug text-muted">{hint}</p>
        ) : null}

        <div className="flex flex-col gap-2">
          {templateOptions.map((option) => {
            const selected = templateId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onTemplateIdChange(option.id)}
                aria-pressed={selected}
                className={`touch-target rounded-xl border-2 px-4 py-3 text-left active:opacity-90 ${
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface"
                }`}
              >
                <span className="block text-base font-bold text-foreground">
                  {option.name}
                </span>
                <span className="mt-1 block text-sm leading-snug text-muted">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {footer}
      </div>
    </details>
  );
}
