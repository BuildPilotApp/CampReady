"use client";

import {
  PackStatusIndicator,
  packStatusLabel,
} from "@/components/checklist/pack-status-indicator";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import type { GearItem } from "@/types";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface GearItemRowProps {
  item: GearItem;
  isEditing?: boolean;
}

function ItemMetaLine({ item }: { item: GearItem }) {
  const parts: string[] = [];
  if (item.storageLocation) {
    parts.push(item.storageLocation);
  }
  if (typeof item.weight_lbs === "number" && item.weight_lbs > 0) {
    parts.push(`${item.weight_lbs} lb`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <span className="mt-0.5 block truncate text-xs text-muted">{parts.join(" · ")}</span>
  );
}

export function GearItemRow({ item, isEditing = false }: GearItemRowProps) {
  const { cycleItemStatus, updateItem, deleteItem } = useCampReady();
  const packed = item.status === "packed";
  const staged = item.status === "staged";
  const [name, setName] = useState(item.name);
  const [weight, setWeight] = useState(
    typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "",
  );
  const [storageLocation, setStorageLocation] = useState(item.storageLocation ?? "");

  useEffect(() => {
    setName(item.name);
    setWeight(typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "");
    setStorageLocation(item.storageLocation ?? "");
  }, [item.id, item.name, item.weight_lbs, item.storageLocation]);

  const saveDetails = () => {
    const weightValue = Number.parseFloat(weight);
    updateItem(item.id, {
      name: name.trim() || item.name,
      weight_lbs: Number.isFinite(weightValue) ? weightValue : undefined,
      storageLocation: storageLocation.trim() || undefined,
    });
  };

  if (isEditing) {
    return (
      <div className="border-b border-border/60 bg-background/40 px-4 py-2.5 last:border-b-0">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveDetails}
          className="touch-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
          placeholder="Item name"
        />
        <div className="mt-1.5 flex gap-2">
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={saveDetails}
            className="touch-target w-16 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground"
            placeholder="lbs"
            aria-label="Weight (lbs)"
          />
          <input
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            onBlur={saveDetails}
            className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground"
            placeholder="Tote, bin, shelf…"
            aria-label="Storage location"
          />
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete "${item.name}"?`)) {
                deleteItem(item.id);
              }
            }}
            className="touch-target inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted active:text-foreground"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-b border-border/60 last:border-b-0 ${
        packed ? "bg-background/40" : staged ? "bg-status-staged-bg/25" : "bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={() => cycleItemStatus(item.id)}
        aria-label={`${item.name}, ${packStatusLabel(item.status)}. Tap to update.`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:opacity-90"
      >
        <PackStatusIndicator status={item.status} />
        <span className="min-w-0 flex-1">
          <span
            className={`block text-base font-semibold leading-snug ${
              packed
                ? "text-muted line-through decoration-border"
                : "text-foreground"
            }`}
          >
            {item.name}
          </span>
          <ItemMetaLine item={item} />
        </span>
        <StatusBadge status={item.status} compact />
      </button>
    </div>
  );
}
