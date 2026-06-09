"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  SAVED_CHECKLISTS_EMPTY_MESSAGE,
  SAVED_CHECKLISTS_HEADER_SUBTITLE,
} from "@/lib/gear-checklist-copy";
import { getTemplateStats } from "@/lib/templates";
import type { ChecklistTemplate } from "@/types";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";

function SavedChecklistCard({ template }: { template: ChecklistTemplate }) {
  const {
    setEditingTemplate,
    deleteTemplate,
    editingTemplateId,
  } = useCampReady();
  const stats = getTemplateStats(template);
  const isEditing = editingTemplateId === template.id;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
        isEditing ? "border-accent bg-accent/5" : "border-border bg-background"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-foreground">
          {template.name}
        </span>
        <span className="mt-0.5 block text-xs font-semibold text-muted">
          {stats.categoryCount} categor{stats.categoryCount === 1 ? "y" : "ies"}
          {" · "}
          {stats.itemCount} item{stats.itemCount === 1 ? "" : "s"}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setEditingTemplate(template.id)}
        className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-bold active:opacity-90 ${
          isEditing
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border text-foreground"
        }`}
      >
        <Pencil className="size-4" aria-hidden />
        {isEditing ? "Editing" : "Edit"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              `Delete checklist "${template.name}"? This cannot be undone.`,
            )
          ) {
            deleteTemplate(template.id);
          }
        }}
        className="touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-border text-muted active:bg-surface"
        aria-label={`Delete ${template.name}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function SavedChecklistsPanel() {
  const { database } = useCampReady();

  const templates = useMemo(
    () =>
      [...(database.templates ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [database.templates],
  );

  return (
    <section className="rounded-xl border-2 border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="size-5 shrink-0 text-accent" aria-hidden />
          <h2 className="text-base font-bold text-foreground">Saved checklists</h2>
        </div>
        <p className="mt-1 pl-7 text-xs leading-snug text-muted">
          {SAVED_CHECKLISTS_HEADER_SUBTITLE}
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {templates.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">
            {SAVED_CHECKLISTS_EMPTY_MESSAGE}
          </p>
        ) : (
          templates.map((template) => (
            <SavedChecklistCard key={template.id} template={template} />
          ))
        )}
      </div>
    </section>
  );
}
