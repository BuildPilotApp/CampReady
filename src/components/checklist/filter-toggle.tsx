"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { ChecklistFilter } from "@/types";

const OPTIONS: { id: ChecklistFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "remaining", label: "To pack" },
];

export function FilterToggle() {
  const { checklistFilter, setChecklistFilter } = useCampReady();

  return (
    <div
      className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm"
      role="tablist"
      aria-label="Gear packing filter"
    >
      <div className="flex rounded-xl border-2 border-border bg-surface p-1">
        {OPTIONS.map((option) => {
          const selected = checklistFilter === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setChecklistFilter(option.id)}
              className={`touch-target flex flex-1 items-center justify-center rounded-lg px-2 text-sm font-bold active:opacity-90 ${
                selected
                  ? "bg-accent text-accent-foreground"
                  : "text-muted"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
