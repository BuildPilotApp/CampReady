"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { useAppToast } from "@/components/ui/app-toast-provider";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { usePersistedDraft } from "@/hooks/use-persisted-draft";
import { splitRecipeNoteSegments, truncateRecipePreview } from "@/lib/meal-prep";
import { openExternalUrl } from "@/lib/open-external-url";
import type { MealPrepItem } from "@/types";
import { Check, ChevronDown, Circle, Pencil, Trash2 } from "lucide-react";
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

  return (
    <div
      className={`border-b border-border/60 last:border-b-0 ${
        consumed ? "bg-background/40" : "bg-surface"
      }`}
    >
      <div className="flex min-h-16 flex-row items-stretch gap-1 px-2 py-2 sm:px-3">
        <button
          type="button"
          onClick={() => toggleMealPrepItemStatus(dayNumber, item.id)}
          aria-pressed={consumed}
          aria-label={`${item.title}, ${consumed ? "Consumed" : "Available"}. Tap to mark ${consumed ? "available" : "consumed"}.`}
          className={`touch-target inline-flex min-h-12 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide active:opacity-90 sm:min-w-14 ${
            consumed
              ? "border-accent/50 bg-accent/15 text-accent"
              : "border-border bg-background text-muted"
          }`}
        >
          {consumed ? (
            <Check className="size-5" strokeWidth={2.75} aria-hidden />
          ) : (
            <Circle className="size-5" strokeWidth={2.25} aria-hidden />
          )}
          <span>{consumed ? "Eaten" : "Ready"}</span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-1">
          {isEditing ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              className="touch-target w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground"
              aria-label="Food title"
            />
          ) : (
            <span
              className={`block truncate text-base font-bold leading-snug ${
                consumed
                  ? "text-muted line-through decoration-border dark:text-zinc-500"
                  : "text-foreground"
              }`}
            >
              {item.title}
            </span>
          )}
          <span
            className={`text-xs font-semibold ${
              consumed ? "text-accent" : "text-muted"
            }`}
          >
            {consumed ? "Consumed" : "Available"}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing((open) => !open)}
            aria-pressed={isEditing}
            aria-label={isEditing ? "Done editing" : `Edit ${item.title}`}
            className={`touch-target-icon inline-flex items-center justify-center rounded-lg border active:opacity-90 ${
              isEditing
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted"
            }`}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          {isEditing ? (
            <button
              ref={ref}
              type="button"
              onClick={handleClick}
              className={`touch-target-icon inline-flex items-center justify-center rounded-lg border active:opacity-90 ${
                armed
                  ? "min-w-16 border-red-500 bg-red-50 px-2 text-xs font-bold text-red-600"
                  : "border-border text-muted"
              }`}
              aria-label={
                armed ? `Confirm delete ${item.title}` : `Delete ${item.title}`
              }
            >
              {armed ? "Confirm?" : <Trash2 className="size-4" aria-hidden />}
            </button>
          ) : null}
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
          isEditing || !hasNotes ? (
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
