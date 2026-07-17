"use client";

import { OverlayModal } from "@/components/ui/overlay-modal";
import {
  modalInputClassName,
  modalTextareaClassName,
} from "@/components/ui/modal-field-styles";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddMealItemDialogProps {
  open: boolean;
  dayLabel: string;
  onClose: () => void;
  onAdd: (input: { title: string; recipeNotes?: string }) => void;
}

export function AddMealItemDialog({
  open,
  dayLabel,
  onClose,
  onAdd,
}: AddMealItemDialogProps) {
  const [title, setTitle] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => titleRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const clearFields = () => {
    setTitle("");
    setRecipeNotes("");
  };

  const commitAdd = (): boolean => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    const notes = recipeNotes.trim();
    onAdd({
      title: trimmed,
      recipeNotes: notes || undefined,
    });
    clearFields();
    return true;
  };

  const handleAddAndClose = () => {
    if (commitAdd()) {
      onClose();
    }
  };

  const handleAddAndContinue = () => {
    if (!commitAdd()) return;
    window.setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleClose = () => {
    clearFields();
    onClose();
  };

  const canAdd = Boolean(title.trim());

  return (
    <OverlayModal title={`Add food · ${dayLabel}`} onClose={handleClose}>
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Food or recipe title
          </span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAndClose();
              }
            }}
            className={modalInputClassName}
            placeholder="Trail mix, chili, breakfast burritos…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Recipe notes (optional)
          </span>
          <textarea
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            rows={5}
            className={`${modalTextareaClassName} min-h-28 resize-y`}
            placeholder="Ingredients, steps, or paste a recipe link…"
          />
        </label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAddAndClose}
            disabled={!canAdd}
            className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground active:opacity-90 disabled:opacity-40"
          >
            <Plus className="size-5" strokeWidth={2.5} aria-hidden />
            Add food item
          </button>
          <button
            type="button"
            onClick={handleAddAndContinue}
            disabled={!canAdd}
            className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-foreground active:opacity-90 disabled:opacity-40"
          >
            Add and continue
          </button>
        </div>
      </div>
    </OverlayModal>
  );
}
