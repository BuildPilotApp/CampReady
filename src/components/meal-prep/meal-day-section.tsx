"use client";

import { AddMealItemDialog } from "@/components/meal-prep/add-meal-item-dialog";
import { MealItemRow } from "@/components/meal-prep/meal-item-row";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import {
  getMealDayProgress,
  getMealDayProgressStyles,
  type VisibleMealPrepDay,
} from "@/lib/meal-prep";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

interface MealDaySectionProps {
  day: VisibleMealPrepDay;
  focusDayNumber: number | null;
  isToday: boolean;
}

export function MealDaySection({
  day,
  focusDayNumber,
  isToday,
}: MealDaySectionProps) {
  const { addMealPrepItem } = useCampReady();
  const isFocused = focusDayNumber === day.dayNumber;
  const [collapsed, setCollapsed] = useState(!isFocused);
  const [addOpen, setAddOpen] = useState(false);
  const dayLabel = `Day ${day.dayNumber}`;
  const progress = getMealDayProgress(day);
  const statusStyles = getMealDayProgressStyles(progress);

  const focusBadge = isToday ? "Today" : isFocused ? "Next" : null;

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-surface ${statusStyles.border}`}
    >
      <div
        className={`relative flex min-h-11 w-full items-center gap-1.5 px-2 ${statusStyles.header}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="touch-target flex min-w-0 flex-1 items-center gap-2 px-2 text-left active:opacity-90"
        >
          <ChevronDown
            className={`size-5 shrink-0 text-accent transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
            aria-hidden
          />
          <span className="min-w-0 flex-1 py-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className="block truncate text-base font-bold leading-tight text-foreground">
                {dayLabel}
              </span>
              {focusBadge ? (
                <span className="inline-flex shrink-0 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent">
                  {focusBadge}
                </span>
              ) : null}
            </span>
            <span
              className={`mt-0.5 block text-xs font-semibold leading-tight ${statusStyles.subtitle}`}
            >
              {day.dateLabel} · {day.consumedCount} / {day.totalCount} consumed
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (collapsed) setCollapsed(false);
            setAddOpen(true);
          }}
          className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-accent active:opacity-90"
          aria-label={`Add food to ${dayLabel}`}
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Add
        </button>
      </div>

      {!collapsed ? (
        <div className="border-t border-border">
          {day.items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              No food items yet. Add meals or recipes for this day.
            </p>
          ) : (
            day.items.map((item) => (
              <MealItemRow
                key={item.id}
                dayNumber={day.dayNumber}
                item={item}
              />
            ))
          )}
          <div className="border-t border-border/60 px-3 py-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-accent active:opacity-90"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add food item
            </button>
          </div>
        </div>
      ) : null}

      <AddMealItemDialog
        open={addOpen}
        dayLabel={dayLabel}
        onClose={() => setAddOpen(false)}
        onAdd={({ title, recipeNotes }) =>
          addMealPrepItem(day.dayNumber, title, recipeNotes)
        }
      />
    </section>
  );
}
