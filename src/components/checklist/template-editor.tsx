"use client";

import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  usePersistedDraft,
  usePersistedGearItemDraft,
} from "@/hooks/use-persisted-draft";
import type { Category, GearItem } from "@/types";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";

function TemplateItemFields({
  templateId,
  item,
}: {
  templateId: string;
  item: GearItem;
}) {
  const { updateTemplateItem, deleteTemplateItem } = useCampReady();
  const { draft, setField, handleBlur } = usePersistedGearItemDraft({
    item,
    onSave: (patch) => updateTemplateItem(templateId, item.id, patch),
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <input
          value={draft.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={handleBlur}
          className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
          placeholder="Gear item"
        />
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="touch-target-icon rounded-lg border border-border text-muted active:bg-background"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-1.5 flex flex-col gap-2 min-[381px]:flex-row">
        <input
          inputMode="decimal"
          value={draft.weight}
          onChange={(e) => setField("weight", e.target.value)}
          onBlur={handleBlur}
          className="touch-target w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground min-[381px]:w-[4.25rem]"
          placeholder="lbs"
          aria-label={`Weight for ${item.name}`}
        />
        <input
          value={draft.storageLocation}
          onChange={(e) => setField("storageLocation", e.target.value)}
          onBlur={handleBlur}
          className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground"
          placeholder="Tote, bin, shelf…"
          aria-label={`Storage for ${item.name}`}
        />
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete gear item?"
        message={`Remove "${item.name}" from this checklist?`}
        confirmLabel="Delete item"
        onConfirm={() => {
          deleteTemplateItem(templateId, item.id);
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      />
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
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const categoryNameId = useId();
  const { draft: categoryName, setDraft: setCategoryName, handleBlur } =
    usePersistedDraft({
      savedValue: category.name,
      resetKey: category.id,
      onSave: (value) => {
        const next = value.trim();
        if (next && next !== category.name) {
          updateTemplateCategory(templateId, category.id, next);
        }
      },
    });

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
        <label htmlFor={categoryNameId} className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Category name
          </span>
          <input
            id={categoryNameId}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onBlur={handleBlur}
            className="touch-target rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
          />
        </label>

        {category.items.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {category.items.map((item) => (
              <li key={item.id}>
                <TemplateItemFields templateId={templateId} item={item} />
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => setAddItemOpen(true)}
          className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-3 py-2.5 text-sm font-semibold text-foreground active:bg-background"
        >
          <Plus className="size-4 text-accent" aria-hidden />
          Add gear item
        </button>

        <AddItemDialog
          open={addItemOpen}
          title="Add gear item"
          onClose={() => setAddItemOpen(false)}
          onAdd={(input) => {
            addTemplateItem({
              templateId,
              categoryId: category.id,
              ...input,
            });
          }}
        />

        <button
          type="button"
          onClick={() => setDeleteCategoryOpen(true)}
          className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground active:bg-surface"
        >
          <Trash2 className="size-4 text-muted" aria-hidden />
          Delete category
        </button>

        <ConfirmDialog
          open={deleteCategoryOpen}
          title="Delete category?"
          message={`Delete "${category.name}" and all of its items from this checklist?`}
          confirmLabel="Delete category"
          onConfirm={() => {
            deleteTemplateCategory(templateId, category.id);
            setDeleteCategoryOpen(false);
          }}
          onCancel={() => setDeleteCategoryOpen(false)}
        />
      </div>
    </details>
  );
}
