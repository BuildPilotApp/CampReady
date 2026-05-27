"use client";

import { CategorySection } from "@/components/checklist/category-section";
import { FilterToggle } from "@/components/checklist/filter-toggle";
import { useCampReady } from "@/components/providers/camp-ready-provider";

export function ChecklistView() {
  const { database, checklistFilter } = useCampReady();

  const hasVisibleCategories = database.categories.some((category) => {
    if (checklistFilter === "remaining") {
      return category.items.some((item) => item.status !== "packed");
    }
    return category.items.length > 0;
  });

  return (
    <div className="relative min-h-full">
      <FilterToggle />
      <div className="flex flex-col gap-3 pb-32 pt-3">
        {hasVisibleCategories ? (
          database.categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              filter={checklistFilter}
            />
          ))
        ) : (
          <section className="rounded-xl border-2 border-border bg-surface px-4 py-8 text-center">
            <p className="text-base font-bold text-foreground">All packed!</p>
            <p className="mt-2 text-sm text-muted">
              Every item is in the vehicle. Switch to &ldquo;All Items&rdquo; to
              review.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
