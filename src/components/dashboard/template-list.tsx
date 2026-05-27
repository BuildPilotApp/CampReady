"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { ChevronRight, Layers, Save } from "lucide-react";
import { useMemo, useState } from "react";

function countTemplateItems(template: { categories: { items: unknown[] }[] }): number {
  return template.categories.reduce((sum, category) => sum + category.items.length, 0);
}

export function TemplateList() {
  const { database, activeTrip, applyTemplateToActiveTrip, createTemplateFromTrip } =
    useCampReady();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const templates = useMemo(() => database.templates ?? [], [database.templates]);

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

      {activeTrip ? (
        <details className="rounded-xl border-2 border-border bg-surface p-4">
          <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-foreground">
            <span className="inline-flex items-center gap-2">
              <Save className="size-5 text-accent" aria-hidden />
              Save current list as template
            </span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Template name
              </span>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                placeholder="My Camp Setup"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Description
              </span>
              <input
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                placeholder="Saved from a trip checklist"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                createTemplateFromTrip({
                  tripId: activeTrip.id,
                  name: templateName,
                  description: templateDescription,
                });
                setTemplateName("");
                setTemplateDescription("");
              }}
              className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90"
            >
              Save template
            </button>
          </div>
        </details>
      ) : null}

      <ul className="flex flex-col gap-3">
        {templates.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => applyTemplateToActiveTrip(template.id)}
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
                  {countTemplateItems(template)} items ·{" "}
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
