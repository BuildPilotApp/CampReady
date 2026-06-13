"use client";

import { OverlayModal } from "@/components/ui/overlay-modal";
import { modalInputClassName } from "@/components/ui/modal-field-styles";
import { Plus } from "lucide-react";
import { useState } from "react";

export interface AddItemInput {
  name: string;
  weight_lbs?: number;
  storageLocation?: string;
}

interface AddItemDialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onAdd: (input: AddItemInput) => void;
}

export function AddItemDialog({
  open,
  title = "Add item",
  onClose,
  onAdd,
}: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [storage, setStorage] = useState("");

  if (!open) {
    return null;
  }

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    const weightValue = Number.parseFloat(weight);
    onAdd({
      name: trimmedName,
      weight_lbs: Number.isFinite(weightValue) ? weightValue : undefined,
      storageLocation: storage.trim() || undefined,
    });
    setName("");
    setWeight("");
    setStorage("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setWeight("");
    setStorage("");
    onClose();
  };

  return (
    <OverlayModal title={title} onClose={handleClose}>
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Item name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            autoFocus
            className={modalInputClassName}
            placeholder="Headlamp"
          />
        </label>
        <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-end gap-2">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Weight (lbs)
            </span>
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${modalInputClassName} min-w-0`}
              placeholder="lbs"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Storage
            </span>
            <input
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className={`${modalInputClassName} min-w-0`}
              placeholder="Tote, bin, shelf…"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground active:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-5" aria-hidden />
          Add item
        </button>
      </div>
    </OverlayModal>
  );
}
