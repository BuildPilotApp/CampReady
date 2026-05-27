"use client";

import { GearItemRow } from "@/components/checklist/gear-item-row";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { Category, ChecklistFilter } from "@/types";
import { ChevronDown } from "lucide-react";

interface CategorySectionProps {
  category: Category;
  filter: ChecklistFilter;
}

export function CategorySection({ category, filter }: CategorySectionProps) {
  const { collapsedCategories, toggleCategory } = useCampReady();
  const collapsed = collapsedCategories[category.id] ?? false;

  const visibleItems =
    filter === "remaining"
      ? category.items.filter((item) => item.status !== "packed")
      : category.items;

  if (visibleItems.length === 0) {
    return null;
  }

  const packedCount = category.items.filter(
    (item) => item.status === "packed",
  ).length;

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
            {packedCount} / {category.items.length} packed
          </span>
        </span>
      </button>

      {!collapsed ? (
        <div className="divide-y divide-border">
          {visibleItems.map((item) => (
            <GearItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
