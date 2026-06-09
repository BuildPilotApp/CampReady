"use client";

import { TemplateCategorySection } from "@/components/checklist/template-editor";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { BUILD_GEAR_CHECKLIST_HINT } from "@/lib/gear-checklist-copy";
import { ClipboardList, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function GearInventoryBuilder() {
  const {
    database,
    editingTemplateId,
    editingTemplate,
    setEditingTemplate,
    createBlankTemplate,
    updateTemplate,
    addTemplateCategory,
  } = useCampReady();
  const [newChecklistName, setNewChecklistName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editName, setEditName] = useState("");

  const template = editingTemplate;

  useEffect(() => {
    setEditName(template?.name ?? "");
  }, [template?.id, template?.name]);

  return (
    <section className="rounded-xl border-2 border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 shrink-0 text-accent" aria-hidden />
          <h2 className="text-base font-bold text-foreground">Build gear checklist</h2>
        </div>
        <p className="mt-1 pl-7 text-xs leading-snug text-muted">
          {BUILD_GEAR_CHECKLIST_HINT}
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {!editingTemplateId || !template ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                Checklist name
              </span>
              <input
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                placeholder="My Camp Gear"
              />
            </label>
            <button
              type="button"
              disabled={!newChecklistName.trim()}
              onClick={() => {
                createBlankTemplate(newChecklistName.trim());
                setNewChecklistName("");
              }}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-5" aria-hidden />
              Start new gear checklist
            </button>
            {(database.templates ?? []).length > 0 ? (
              <p className="text-sm text-muted">
                Or tap Edit on a saved checklist above to keep building it.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  Checklist name
                </span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    const next = editName.trim();
                    if (next && next !== template.name) {
                      updateTemplate(template.id, { name: next });
                    }
                  }}
                  className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                />
              </label>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="touch-target shrink-0 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-bold text-foreground active:opacity-90"
              >
                Done
              </button>
            </div>

            <div className="rounded-xl border-2 border-border bg-background p-4">
              <p className="text-sm font-bold text-foreground">Add category or tote</p>
              <p className="mt-1 text-xs leading-snug text-muted">
                Group your gear inventory by category—for example Kitchen, Shelter,
                or Tools.
              </p>
              <div className="mt-2 flex gap-3">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-surface px-3 text-base font-semibold text-foreground"
                  placeholder="Kitchen"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = newCategoryName.trim();
                    if (!next) return;
                    addTemplateCategory(template.id, next);
                    setNewCategoryName("");
                  }}
                  className="touch-target inline-flex w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground active:opacity-90"
                  aria-label="Add category"
                >
                  <Plus className="size-6" aria-hidden />
                </button>
              </div>
            </div>

            {template.categories.length === 0 ? (
              <p className="text-sm text-muted">
                Add a category above, then add gear items under each category.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {template.categories.map((category) => (
                  <TemplateCategorySection
                    key={category.id}
                    templateId={template.id}
                    category={category}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
