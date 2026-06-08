"use client";

import { CategorySection } from "@/components/checklist/category-section";
import { FilterToggle } from "@/components/checklist/filter-toggle";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { isGearItemRemaining } from "@/lib/gear-items";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ChecklistView() {
  const { activeTrip, activeTripStats, checklistFilter, addCategory } = useCampReady();
  const [newCategoryName, setNewCategoryName] = useState("");

  const categories = activeTrip?.categories ?? [];

  const hasRemainingWork = categories.some(
    (category) =>
      category.items.length === 0 || category.items.some(isGearItemRemaining),
  );

  const allPacked =
    activeTripStats !== null &&
    activeTripStats.totalItems > 0 &&
    activeTripStats.packedItems === activeTripStats.totalItems;

  return (
    <div className="relative min-h-full">
      <FilterToggle />
      <div className="mt-3 rounded-xl border-2 border-border bg-surface p-4">
        <p className="text-sm font-bold text-foreground">Add Category or Tote</p>
        <div className="mt-2 flex gap-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="touch-target flex-1 rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
            placeholder="Kitchen"
          />
          <button
            type="button"
            onClick={() => {
              const name = newCategoryName.trim();
              if (!name) return;
              addCategory(name);
              setNewCategoryName("");
            }}
            className="touch-target inline-flex w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground active:opacity-90"
            aria-label="Add category or tote"
          >
            <Plus className="size-6" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 pb-32 pt-3">
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            filter={checklistFilter}
          />
        ))}
        {checklistFilter === "remaining" && allPacked && !hasRemainingWork ? (
          <section className="rounded-xl border-2 border-border bg-surface px-4 py-8 text-center">
            <p className="text-base font-bold text-foreground">All packed!</p>
            <p className="mt-2 text-sm text-muted">
              Every item is in the vehicle. Switch to &ldquo;All Items&rdquo; to
              review.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
