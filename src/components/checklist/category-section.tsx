"use client";

import { GearItemRow } from "@/components/checklist/gear-item-row";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  getCategoryPackCounts,
  getCategoryStatus,
  getCategoryStatusStyles,
  getCategoryTotalWeightLbs,
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
  const [addItemOpen, setAddItemOpen] = useState(false);

  useEffect(() => {
    setRename(category.name);
  }, [category.id, category.name]);

  useEffect(() => {
    if (collapsed) {
      setIsEditing(false);
      setAddItemOpen(false);
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
  const totalWeightLbs = getCategoryTotalWeightLbs(category.items);
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

  const weightLabel =
    totalWeightLbs > 0
      ? `${itemCount} item${itemCount === 1 ? "" : "s"} · ${totalWeightLbs % 1 === 0 ? totalWeightLbs : totalWeightLbs.toFixed(1)} lbs`
      : `${itemCount} item${itemCount === 1 ? "" : "s"}`;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-zinc-800 bg-surface dark:border-zinc-800 ${statusStyles.border}`}
    >
      <div
        className={`flex min-h-11 w-full items-stretch gap-1 px-2 ${statusStyles.header}`}
      >
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          aria-expanded={!collapsed}
          className="touch-target flex min-w-0 flex-1 items-center gap-3 px-2 text-left active:opacity-90"
        >
          <ChevronDown
            className={`size-5 shrink-0 text-accent transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-foreground">{category.name}</span>
              <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[0.65rem] font-semibold text-muted">
                {weightLabel}
              </span>
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
          className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold active:opacity-90 ${
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

              <button
                type="button"
                onClick={() => setAddItemOpen(true)}
                className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-3 py-2.5 text-sm font-semibold text-foreground active:bg-background"
              >
                <Plus className="size-4 text-accent" aria-hidden />
                Add item
              </button>

              <AddItemDialog
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onAdd={(input) => {
                  addItem({
                    categoryId: category.id,
                    ...input,
                  });
                }}
              />

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete category "${category.name}" and its items?`)) {
                    deleteCategory(category.id);
                  }
                }}
                className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-bold text-muted active:bg-surface active:text-foreground"
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
