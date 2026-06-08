"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { GearItem } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface GearItemRowProps {
  item: GearItem;
}

export function GearItemRow({ item }: GearItemRowProps) {
  const { cycleItemStatus, updateItem, deleteItem } = useCampReady();
  const packed = item.status === "packed";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [weight, setWeight] = useState(
    typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "",
  );
  const [storageLocation, setStorageLocation] = useState(item.storageLocation ?? "");

  return (
    <div className="bg-surface">
      <div className="flex items-stretch gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => cycleItemStatus(item.id)}
          aria-label={`${item.name}, ${item.status}. Tap to change status.`}
          className="flex min-h-14 flex-1 items-center gap-3 text-left active:opacity-90"
        >
          <span className="min-w-0 flex-1">
            <span
              className={`block text-base font-semibold leading-snug text-foreground ${
                packed ? "line-through opacity-70" : ""
              }`}
            >
              {item.name}
            </span>
            {item.storageLocation ? (
              <span className="mt-0.5 block text-xs font-semibold text-muted">
                {item.storageLocation}
              </span>
            ) : null}
            {typeof item.weight_lbs === "number" && item.weight_lbs > 0 ? (
              <span className="mt-0.5 block text-xs font-medium text-muted">
                {item.weight_lbs} lb
              </span>
            ) : null}
          </span>
          <StatusBadge status={item.status} />
        </button>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="touch-target inline-flex w-14 items-center justify-center rounded-xl border-2 border-border bg-background text-foreground active:opacity-90"
          aria-label="Edit item"
        >
          <Pencil className="size-5 text-muted" aria-hidden />
        </button>
      </div>

      {editing ? (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                Item name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
              />
            </label>
            <div className="flex gap-3">
              <input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="touch-target w-28 rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                placeholder="lbs"
                aria-label="Weight (lbs)"
              />
              <input
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="touch-target flex-1 rounded-xl border-2 border-border bg-background px-3 text-base font-medium text-foreground"
                placeholder="Storage (Bin 1)"
                aria-label="Storage location"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const weightValue = Number.parseFloat(weight);
                updateItem(item.id, {
                  name: name.trim() || item.name,
                  weight_lbs: Number.isFinite(weightValue) ? weightValue : undefined,
                  storageLocation: storageLocation.trim() || undefined,
                });
                setEditing(false);
              }}
              className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${item.name}"?`)) {
                  deleteItem(item.id);
                }
              }}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
            >
              <Trash2 className="size-5 text-muted" aria-hidden />
              Delete item
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
