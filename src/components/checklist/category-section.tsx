"use client";

import { GearItemRow } from "@/components/checklist/gear-item-row";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  getCategoryPackCounts,
  getCategoryStatus,
  getCategoryStatusStyles,
  isGearItemRemaining,
} from "@/lib/gear-items";
import type { Category, ChecklistFilter } from "@/types";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CategorySectionProps {
  category: Category;
  filter: ChecklistFilter;
}

export function CategorySection({ category, filter }: CategorySectionProps) {
  const { collapsedCategories, toggleCategory, updateCategory, deleteCategory, addItem } =
    useCampReady();
  const collapsed = collapsedCategories[category.id] ?? false;
  const [isEditing, setIsEditing] = useState(false);
  const [rename, setRename] = useState(category.name);
  const [newItemName, setNewItemName] = useState("");
  const [newItemWeight, setNewItemWeight] = useState<string>("");
  const [newItemStorage, setNewItemStorage] = useState("");

  useEffect(() => {
    setRename(category.name);
  }, [category.id, category.name]);

  useEffect(() => {
    if (collapsed) {
      setIsEditing(false);
    }
  }, [collapsed]);

  const visibleItems =
    filter === "remaining"
      ? category.items.filter(isGearItemRemaining)
      : category.items;

  if (filter === "remaining" && category.items.length > 0 && visibleItems.length === 0) {
    return null;
  }

  const { packed: packedCount, total: itemCount } = getCategoryPackCounts(category.items);
  const categoryStatus = getCategoryStatus(category.items);
  const statusStyles = getCategoryStatusStyles(categoryStatus);

  const handleEditClick = () => {
    if (collapsed) {
      toggleCategory(category.id);
      setIsEditing(true);
      return;
    }
    setIsEditing((open) => !open);
  };

  return (
    <section
      className={`overflow-hidden rounded-xl border-2 bg-surface ${statusStyles.border}`}
    >
      <div
        className={`flex min-h-11 w-full items-center gap-2 px-4 py-2.5 ${statusStyles.header}`}
      >
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-90"
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
            <span className={`text-xs font-semibold ${statusStyles.subtitle}`}>
              {packedCount} / {itemCount} packed
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleEditClick}
          aria-expanded={isEditing}
          className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold active:opacity-90 ${
            isEditing
              ? "border-accent bg-accent/15 text-foreground"
              : "border-border/60 text-muted active:text-foreground"
          }`}
        >
          <Pencil className="size-3.5" aria-hidden />
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {!collapsed ? (
        <div>
          {isEditing ? (
            <div className="space-y-3 border-t border-border/40 bg-background/50 px-4 py-3">
              <input
                value={rename}
                onChange={(e) => setRename(e.target.value)}
                onBlur={() => {
                  const next = rename.trim();
                  if (next && next !== category.name) {
                    updateCategory(category.id, next);
                  } else {
                    setRename(category.name);
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
          ) : null}

          {visibleItems.length > 0 ? (
            <div className="border-t border-border/60">
              {visibleItems.map((item) => (
                <GearItemRow key={item.id} item={item} isEditing={isEditing} />
              ))}
            </div>
          ) : (
            <p className="border-t border-border/60 px-4 py-4 text-sm text-muted">
              No items in this category yet.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
