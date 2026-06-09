"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { getTemplateStats } from "@/lib/templates";
import type { Category, ChecklistTemplate } from "@/types";
import { ChevronDown, Layers, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function TemplateItemRow({
  templateId,
  itemId,
  name,
}: {
  templateId: string;
  itemId: string;
  name: string;
}) {
  const { updateTemplateItem, deleteTemplateItem } = useCampReady();
  const [itemName, setItemName] = useState(name);

  return (
    <div className="flex items-center gap-2 py-2">
      <input
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        onBlur={() => {
          const next = itemName.trim();
          if (next && next !== name) {
            updateTemplateItem(templateId, itemId, { name: next });
          }
        }}
        className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
      />
      <button
        type="button"
        onClick={() => deleteTemplateItem(templateId, itemId)}
        className="touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted active:bg-background"
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function TemplateCategorySection({
  templateId,
  category,
}: {
  templateId: string;
  category: Category;
}) {
  const {
    updateTemplateCategory,
    deleteTemplateCategory,
    addTemplateItem,
  } = useCampReady();
  const [categoryName, setCategoryName] = useState(category.name);
  const [newItemName, setNewItemName] = useState("");

  return (
    <details className="group/category overflow-hidden rounded-xl border border-border bg-background">
      <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 active:bg-surface">
        <span className="inline-flex min-w-0 items-center gap-2">
          <ChevronDown
            className="size-4 shrink-0 text-accent transition-transform group-open/category:rotate-180"
            aria-hidden
          />
          <span className="truncate text-sm font-bold text-foreground">
            {category.name}
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-muted">
          {category.items.length} item{category.items.length === 1 ? "" : "s"}
        </span>
      </summary>

      <div className="border-t border-border px-3 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            Category name
          </span>
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onBlur={() => {
              const next = categoryName.trim();
              if (next && next !== category.name) {
                updateTemplateCategory(templateId, category.id, next);
              }
            }}
            className="touch-target rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
          />
        </label>

        <ul className="mt-3 divide-y divide-border">
          {category.items.map((item) => (
            <li key={item.id}>
              <TemplateItemRow
                templateId={templateId}
                itemId={item.id}
                name={item.name}
              />
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
            placeholder="Add item"
          />
          <button
            type="button"
            onClick={() => {
              const next = newItemName.trim();
              if (!next) return;
              addTemplateItem({
                templateId,
                categoryId: category.id,
                name: next,
              });
              setNewItemName("");
            }}
            className="touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground active:opacity-90"
            aria-label="Add item"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Delete category "${category.name}" and all of its items?`,
              )
            ) {
              deleteTemplateCategory(templateId, category.id);
            }
          }}
          className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground active:bg-surface"
        >
          <Trash2 className="size-4 text-muted" aria-hidden />
          Delete category
        </button>
      </div>
    </details>
  );
}

function SavedChecklistCard({ template }: { template: ChecklistTemplate }) {
  const {
    updateTemplate,
    deleteTemplate,
    addTemplateCategory,
  } = useCampReady();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [newCategoryName, setNewCategoryName] = useState("");
  const stats = getTemplateStats(template);

  return (
    <details className="group overflow-hidden rounded-xl border-2 border-border bg-surface">
      <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 active:bg-background">
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
        <ChevronDown
          className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            Checklist name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const next = name.trim();
              if (next && next !== template.name) {
                updateTemplate(template.id, { name: next });
              }
            }}
            className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
            Description
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              const next = description.trim();
              if (next !== template.description) {
                updateTemplate(template.id, { description: next });
              }
            }}
            className="touch-target rounded-xl border-2 border-border bg-background px-3 text-sm font-medium text-foreground"
          />
        </label>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Categories & items
          </p>
          {template.categories.length === 0 ? (
            <p className="text-sm text-muted">No categories yet.</p>
          ) : (
            template.categories.map((category) => (
              <TemplateCategorySection
                key={category.id}
                templateId={template.id}
                category={category}
              />
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-background px-3 text-sm font-semibold text-foreground"
            placeholder="New category"
          />
          <button
            type="button"
            onClick={() => {
              const next = newCategoryName.trim();
              if (!next) return;
              addTemplateCategory(template.id, next);
              setNewCategoryName("");
            }}
            className="touch-target inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground active:opacity-90"
            aria-label="Add category"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>

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
          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-bold text-foreground active:opacity-90"
        >
          <Trash2 className="size-5 text-muted" aria-hidden />
          Delete checklist
        </button>
      </div>
    </details>
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
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Layers className="size-5 text-accent" aria-hidden />
        <h2 className="text-base font-bold text-foreground">Saved checklists</h2>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {templates.length === 0 ? (
          <p className="text-sm leading-snug text-muted">
            No saved checklists yet. Build a trip checklist and use Save custom
            checklist below, or save one from a trip on the Dashboard.
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
