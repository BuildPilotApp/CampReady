"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { CHECKLIST_TEMPLATES } from "@/lib/templates";
import { ChevronRight, Layers } from "lucide-react";

function countTemplateItems(templateId: string): number {
  const template = CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId);
  if (!template) {
    return 0;
  }
  return template.categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
}

export function TemplateList() {
  const { applyTemplate } = useCampReady();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers className="size-5 shrink-0 text-accent" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">Templates</h2>
      </div>
      <p className="text-sm leading-snug text-muted">
        Tap a template to load its checklist. Your current list will be
        replaced.
      </p>

      <ul className="flex flex-col gap-3">
        {CHECKLIST_TEMPLATES.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => applyTemplate(template.id)}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 py-3 text-left active:bg-background"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Layers className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-foreground">
                  {template.name}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {template.description}
                </span>
                <span className="mt-1 block text-xs font-semibold text-accent">
                  {countTemplateItems(template.id)} items ·{" "}
                  {template.categories.length} categories
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
