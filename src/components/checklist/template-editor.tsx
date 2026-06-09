"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { Category } from "@/types";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function TemplateItemRow({
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

export function TemplateCategorySection({
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
    <details className="group/category overflow-hidden rounded-xl border border-border bg-background" open>
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
            placeholder="Add gear item"
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
            aria-label="Add gear item"
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
