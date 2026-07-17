"use client";

import { MealStatusBadge } from "@/components/meal-prep/meal-status-badge";
import {
  MealStatusIndicator,
  mealStatusLabel,
} from "@/components/meal-prep/meal-status-indicator";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { useAppToast } from "@/components/ui/app-toast-provider";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { usePersistedDraft } from "@/hooks/use-persisted-draft";
import { splitRecipeNoteSegments, truncateRecipePreview } from "@/lib/meal-prep";
import { openExternalUrl } from "@/lib/open-external-url";
import type { MealPrepItem } from "@/types";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";

interface MealItemRowProps {
  dayNumber: number;
  item: MealPrepItem;
}

function RecipeNoteDisplay({ notes }: { notes: string }) {
  const { showToast } = useAppToast();
  const segments = splitRecipeNoteSegments(notes);

  const handleUrlClick = async (
    event: MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    event.preventDefault();
    const result = await openExternalUrl(url);
    if (!result.ok) {
      showToast(result.message, "error");
    }
  };

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
      {segments.map((segment, index) =>
        segment.type === "url" ? (
          <a
            key={`${index}-${segment.value}`}
            href={segment.value}
            onClick={(event) => void handleUrlClick(event, segment.value)}
            className="font-semibold text-accent underline underline-offset-2"
          >
            {segment.value}
          </a>
        ) : (
          <span key={`${index}-text`}>{segment.value}</span>
        ),
      )}
    </p>
  );
}

export function MealItemRow({ dayNumber, item }: MealItemRowProps) {
  const {
    updateMealPrepItem,
    toggleMealPrepItemStatus,
    deleteMealPrepItem,
  } = useCampReady();
  const consumed = item.status === "consumed";
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    draft: titleDraft,
    setDraft: setTitleDraft,
    handleBlur: handleTitleBlur,
  } = usePersistedDraft({
    savedValue: item.title,
    resetKey: item.id,
    onSave: (value) => {
      const next = value.trim();
      if (next && next !== item.title) {
        updateMealPrepItem(dayNumber, item.id, { title: next });
      }
    },
  });

  const {
    draft: notesDraft,
    setDraft: setNotesDraft,
    handleBlur: handleNotesBlur,
  } = usePersistedDraft({
    savedValue: item.recipeNotes ?? "",
    resetKey: `${item.id}-notes`,
    rejectEmpty: false,
    normalize: (value) => value.trim(),
    onSave: (value) => {
      updateMealPrepItem(dayNumber, item.id, {
        recipeNotes: value.trim() || undefined,
      });
    },
  });

  const { armed, handleClick, ref } = useDestructiveConfirm(() =>
    deleteMealPrepItem(dayNumber, item.id),
  );

  const hasNotes = Boolean((item.recipeNotes ?? "").trim());
  const statusLabel = mealStatusLabel(item.status);

  if (isEditing) {
    return (
      <div className="border-b border-border/60 bg-background/40 px-4 py-2.5 last:border-b-0">
        <div className="flex items-start gap-2">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleBlur}
            className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground"
            aria-label="Food title"
            placeholder="Food title"
          />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            aria-pressed
            aria-label="Done editing"
            className="touch-target-icon inline-flex shrink-0 items-center justify-center rounded-lg border border-accent bg-accent/15 text-accent active:opacity-90"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={`touch-target-icon shrink-0 rounded-lg border active:opacity-90 ${
              armed
                ? "min-w-16 border-red-500 bg-red-50 px-3 text-xs font-bold text-red-600"
                : "border-border text-muted active:text-foreground"
            }`}
            aria-label={
              armed ? `Confirm delete ${item.title}` : `Delete ${item.title}`
            }
          >
            {armed ? "Confirm?" : <Trash2 className="size-4" aria-hidden />}
          </button>
        </div>

        <div className="mt-2 border-t border-border/40 pt-2">
          <button
            type="button"
            onClick={() => setRecipeOpen((open) => !open)}
            aria-expanded={recipeOpen}
            className="touch-target flex w-full items-center gap-2 py-1 text-left text-sm font-semibold text-muted active:opacity-90"
          >
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${
                recipeOpen ? "" : "-rotate-90"
              }`}
              aria-hidden
            />
            Recipe notes
          </button>
          {recipeOpen || !hasNotes ? (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleNotesBlur}
              rows={4}
              className="mt-1 min-h-24 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
              placeholder="Ingredients, steps, or paste a recipe link…"
              aria-label={`Recipe notes for ${item.title}`}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-b border-border/60 last:border-b-0 ${
        consumed ? "bg-background/40" : "bg-surface"
      }`}
    >
      <div className="flex min-h-16 flex-row items-center">
        <button
          type="button"
          onClick={() => toggleMealPrepItemStatus(dayNumber, item.id)}
          aria-label={`${item.title}, ${statusLabel}. Tap to update.`}
          className="flex min-h-16 min-w-0 flex-1 items-center gap-2.5 px-3 text-left active:opacity-90 sm:gap-3"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center sm:size-11">
            <MealStatusIndicator status={item.status} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span
              className={`block truncate text-base font-bold leading-snug ${
                consumed
                  ? "text-muted line-through decoration-border dark:text-zinc-500 dark:decoration-zinc-600"
                  : "text-foreground dark:text-white"
              }`}
            >
              {item.title}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 flex-row items-center gap-1.5 pr-2 sm:gap-2 sm:pr-3">
          <MealStatusBadge
            status={item.status}
            compact
            className="hidden shrink-0 sm:inline-flex"
          />
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${item.title}`}
            className="touch-target-icon inline-flex items-center justify-center rounded-lg border border-border text-muted active:opacity-90"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="border-t border-border/40 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => setRecipeOpen((open) => !open)}
          aria-expanded={recipeOpen}
          className="touch-target flex w-full items-center gap-2 py-1 text-left text-sm font-semibold text-muted active:opacity-90"
        >
          <ChevronDown
            className={`size-4 shrink-0 transition-transform ${
              recipeOpen ? "" : "-rotate-90"
            }`}
            aria-hidden
          />
          Recipe notes
          {!recipeOpen && hasNotes ? (
            <span className="min-w-0 truncate text-xs font-medium text-muted/80">
              · {truncateRecipePreview(item.recipeNotes ?? "")}
            </span>
          ) : null}
        </button>

        {recipeOpen ? (
          !hasNotes ? (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleNotesBlur}
              rows={4}
              className="mt-1 min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
              placeholder="Ingredients, steps, or paste a recipe link…"
              aria-label={`Recipe notes for ${item.title}`}
            />
          ) : (
            <div className="mt-1 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <RecipeNoteDisplay notes={item.recipeNotes ?? ""} />
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs font-bold text-accent active:opacity-90"
              >
                Edit notes
              </button>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
