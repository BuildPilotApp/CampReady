"use client";

import { CategorySection } from "@/components/checklist/category-section";
import { FilterToggle } from "@/components/checklist/filter-toggle";
import { GearInventoryBuilder } from "@/components/checklist/gear-inventory-builder";
import { SaveChecklistTemplate } from "@/components/checklist/save-checklist-template";
import { SavedChecklistsPanel } from "@/components/checklist/saved-checklists-panel";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  NO_ACTIVE_TRIP_MESSAGE,
  PACK_TRIP_HINT,
} from "@/lib/gear-checklist-copy";
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
      <section className="flex flex-col gap-3">
        <SavedChecklistsPanel />
        <GearInventoryBuilder />
        <SaveChecklistTemplate />
      </section>

      {activeTrip ? (
        <section className="mt-5 flex flex-col gap-3">
          <div className="rounded-xl border-2 border-border bg-surface px-4 py-3">
            <h2 className="text-base font-bold text-foreground">
              Pack for {activeTrip.name}
            </h2>
            <p className="mt-2 text-sm leading-snug text-muted">{PACK_TRIP_HINT}</p>
          </div>

          <FilterToggle />

          <div className="rounded-xl border-2 border-border bg-surface p-4">
            <p className="text-sm font-bold text-foreground">Add category or tote</p>
            <p className="mt-1 text-xs leading-snug text-muted">
              Group gear by category for one-tap staging and checkoff.
            </p>
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

          <div className="flex flex-col gap-3 pb-32">
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
        </section>
      ) : (
        <section className="mt-5 rounded-xl border-2 border-border bg-surface px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">Trip packing</p>
          <p className="mt-2 text-sm leading-snug text-muted">{NO_ACTIVE_TRIP_MESSAGE}</p>
        </section>
      )}
    </div>
  );
}
