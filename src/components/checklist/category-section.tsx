"use client";

import { GearItemRow } from "@/components/checklist/gear-item-row";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { getCategoryPackCounts, isGearItemRemaining } from "@/lib/gear-items";
import type { Category, ChecklistFilter } from "@/types";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
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
  const [newItemIsContainer, setNewItemIsContainer] = useState(false);
  const [newSubItemNames, setNewSubItemNames] = useState<string[]>([""]);

  const visibleItems =
    filter === "remaining"
      ? category.items.filter(isGearItemRemaining)
      : category.items;

  if (filter === "remaining" && visibleItems.length === 0) {
    return null;
  }

  const { packed: packedCount, total: itemCount } = getCategoryPackCounts(category.items);

  function resetAddItemForm() {
    setNewItemName("");
    setNewItemWeight("");
    setNewItemStorage("");
    setNewItemIsContainer(false);
    setNewSubItemNames([""]);
  }

  function handleAddItem() {
    const name = newItemName.trim();
    if (!name) return;
    const weight = Number.parseFloat(newItemWeight);
    addItem({
      categoryId: category.id,
      name,
      weight_lbs: Number.isFinite(weight) ? weight : undefined,
      storageLocation: newItemStorage.trim() || undefined,
      isContainer: newItemIsContainer,
      subItemNames: newItemIsContainer ? newSubItemNames : undefined,
    });
    resetAddItemForm();
  }

  return (
    <section className="overflow-hidden rounded-xl border-2 border-border bg-surface">
      <button
        type="button"
        onClick={() => toggleCategory(category.id)}
        aria-expanded={!collapsed}
        className="flex min-h-12 w-full items-center gap-3 bg-accent/10 px-4 py-3 text-left active:bg-accent/20"
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
          <span className="text-xs font-semibold text-muted">
            {packedCount} / {itemCount} packed
          </span>
        </span>
      </button>

      {!collapsed ? (
        <div className="divide-y divide-border">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  Rename category
                </span>
                <input
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                  onBlur={() => {
                    const next = rename.trim();
                    if (next && next !== category.name) {
                      updateCategory(category.id, next);
                    }
                  }}
                  className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                />
              </label>

              <div className="grid grid-cols-1 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                    Add item
                  </span>
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                    placeholder="Kitchen Tote"
                  />
                </label>
                <div className="flex gap-3">
                  <input
                    inputMode="decimal"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(e.target.value)}
                    className="touch-target w-28 rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                    placeholder="lbs"
                    aria-label="Weight (lbs)"
                  />
                  <input
                    value={newItemStorage}
                    onChange={(e) => setNewItemStorage(e.target.value)}
                    className="touch-target flex-1 rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                    placeholder="Storage (Bin 1)"
                    aria-label="Storage location"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl border-2 border-border bg-background px-3 py-3">
                  <input
                    type="checkbox"
                    checked={newItemIsContainer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewItemIsContainer(checked);
                      if (checked && newSubItemNames.length === 0) {
                        setNewSubItemNames([""]);
                      }
                    }}
                    className="mt-1 size-5 shrink-0 accent-accent"
                  />
                  <span>
                    <span className="block text-sm font-bold text-foreground">
                      Container with sub-items
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      For totes, bins, or kits that hold multiple items inside.
                    </span>
                  </span>
                </label>

                {newItemIsContainer ? (
                  <div className="rounded-xl border-2 border-border bg-background p-3">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                      Sub-items in this container
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {newSubItemNames.map((subName, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <input
                            value={subName}
                            onChange={(e) => {
                              const next = [...newSubItemNames];
                              next[index] = e.target.value;
                              setNewSubItemNames(next);
                            }}
                            className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                            placeholder="e.g. Pots & pans"
                          />
                          {newSubItemNames.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNewSubItemNames(
                                  newSubItemNames.filter((_, i) => i !== index),
                                );
                              }}
                              className="touch-target inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-surface text-foreground active:opacity-90"
                              aria-label="Remove sub-item field"
                            >
                              <X className="size-4 text-muted" aria-hidden />
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setNewSubItemNames([...newSubItemNames, ""])}
                      className="touch-target mt-3 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-3 text-sm font-bold text-foreground active:opacity-90"
                    >
                      <Plus className="size-4" aria-hidden />
                      Add sub-item
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90"
                >
                  <Plus className="size-5" aria-hidden />
                  Add item
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete category "${category.name}" and its items?`)) {
                    deleteCategory(category.id);
                  }
                }}
                className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
              >
                <Trash2 className="size-5 text-muted" aria-hidden />
                Delete category
              </button>
            </div>
          </div>
          {visibleItems.map((item) => (
            <GearItemRow key={item.id} item={item} filter={filter} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
