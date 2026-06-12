"use client";

import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { Category, GearItem } from "@/types";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

function parseWeightLbs(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function TemplateItemFields({
  templateId,
  item,
}: {
  templateId: string;
  item: GearItem;
}) {
  const { updateTemplateItem, deleteTemplateItem } = useCampReady();
  const [itemName, setItemName] = useState(item.name);
  const [weight, setWeight] = useState(
    typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "",
  );
  const [storageLocation, setStorageLocation] = useState(
    item.storageLocation ?? "",
  );

  useEffect(() => {
    setItemName(item.name);
    setWeight(typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "");
    setStorageLocation(item.storageLocation ?? "");
  }, [item.id, item.name, item.weight_lbs, item.storageLocation]);

  const saveItem = () => {
    const nextName = itemName.trim() || item.name;
    updateTemplateItem(templateId, item.id, {
      name: nextName,
      weight_lbs: parseWeightLbs(weight),
      storageLocation: storageLocation.trim() || undefined,
    });
  };

  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onBlur={saveItem}
          className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
          placeholder="Gear item"
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete "${item.name}" from this checklist?`)) {
              deleteTemplateItem(templateId, item.id);
            }
          }}
          className="touch-target-icon rounded-lg border border-border text-muted active:bg-background"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-1.5 flex gap-2">
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={saveItem}
          className="touch-target w-[4.25rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground"
          placeholder="lbs"
          aria-label={`Weight for ${item.name}`}
        />
        <input
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          onBlur={saveItem}
          className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground"
          placeholder="Tote, bin, shelf…"
          aria-label={`Storage for ${item.name}`}
        />
      </div>
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
  const [addItemOpen, setAddItemOpen] = useState(false);

  useEffect(() => {
    setCategoryName(category.name);
  }, [category.id, category.name]);

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
              } else {
                setCategoryName(category.name);
              }
            }}
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
