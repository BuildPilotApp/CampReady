"use client";

import { GearItemRow } from "@/components/checklist/gear-item-row";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { getCategoryPackCounts, isGearItemRemaining } from "@/lib/gear-items";
import type { Category, ChecklistFilter } from "@/types";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CategorySectionProps {
  category: Category;
  filter: ChecklistFilter;
}

export function CategorySection({ category, filter }: CategorySectionProps) {
  const { collapsedCategories, toggleCategory, updateCategory, deleteCategory, addItem } =
    useCampReady();
  const collapsed = collapsedCategories[category.id] ?? false;
  const [rename, setRename] = useState(category.name);
  const [newItemName, setNewItemName] = useState("");
  const [newItemWeight, setNewItemWeight] = useState<string>("");
  const [newItemStorage, setNewItemStorage] = useState("");

  const visibleItems =
    filter === "remaining"
      ? category.items.filter(isGearItemRemaining)
      : category.items;

  if (filter === "remaining" && category.items.length > 0 && visibleItems.length === 0) {
    return null;
  }

  const { packed: packedCount, total: itemCount } = getCategoryPackCounts(category.items);
  const allPacked = itemCount > 0 && packedCount === itemCount;

  return (
    <section className="overflow-hidden rounded-xl border-2 border-border bg-surface">
      <button
        type="button"
        onClick={() => toggleCategory(category.id)}
        aria-expanded={!collapsed}
        className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left active:opacity-90 ${
          allPacked ? "bg-status-packed-bg/40" : "bg-accent/8"
        }`}
      >
        <ChevronDown
          className={`size-5 shrink-0 text-accent transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-foreground">
            {category.name}
          </span>
          <span
            className={`text-xs font-semibold ${
              allPacked ? "text-status-packed-fg" : "text-muted"
            }`}
          >
            {packedCount} / {itemCount} packed
          </span>
        </span>
      </button>

      {!collapsed ? (
        <div>
          {visibleItems.length > 0 ? (
            <div>
              {visibleItems.map((item) => (
                <GearItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="border-t border-border/60 px-4 py-4 text-sm text-muted">
              No items in this category yet.
            </p>
          )}

          <details className="group/manage border-t border-border/60">
            <summary className="touch-target cursor-pointer list-none px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-muted/70 active:text-muted">
              Manage category
            </summary>
            <div className="space-y-3 border-t border-border/40 bg-background/50 px-4 py-3">
              <input
                value={rename}
                onChange={(e) => setRename(e.target.value)}
                onBlur={() => {
                  const next = rename.trim();
                  if (next && next !== category.name) {
                    updateCategory(category.id, next);
                  }
                }}
                className="touch-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
                placeholder="Category name"
                aria-label="Rename category"
              />

              <div className="rounded-lg border border-dashed border-border p-2.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                  Add item
                </p>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="touch-target mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
                  placeholder="Headlamp"
                />
                <div className="mt-1.5 flex gap-2">
                  <input
                    inputMode="decimal"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(e.target.value)}
                    className="touch-target w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
                    placeholder="lbs"
                    aria-label="Weight (lbs)"
                  />
                  <input
                    value={newItemStorage}
                    onChange={(e) => setNewItemStorage(e.target.value)}
                    className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
                    placeholder="Tote, bin, shelf…"
                    aria-label="Storage location"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = newItemName.trim();
                      if (!name) return;
                      const weight = Number.parseFloat(newItemWeight);
                      addItem({
                        categoryId: category.id,
                        name,
                        weight_lbs: Number.isFinite(weight) ? weight : undefined,
                        storageLocation: newItemStorage.trim() || undefined,
                      });
                      setNewItemName("");
                      setNewItemWeight("");
                      setNewItemStorage("");
                    }}
                    className="touch-target inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground active:opacity-90"
                    aria-label="Add item"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete category "${category.name}" and its items?`)) {
                    deleteCategory(category.id);
                  }
                }}
                className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-muted active:text-foreground"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete category
              </button>
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
