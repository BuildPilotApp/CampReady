"use client";

import {
  PackStatusIndicator,
  packStatusLabel,
} from "@/components/checklist/pack-status-indicator";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { buildAmazonAffiliateSearchUrl } from "@/lib/affiliate-links";
import { openExternalUrl } from "@/lib/open-external-url";
import type { GearItem } from "@/types";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface GearItemRowProps {
  item: GearItem;
  isEditing?: boolean;
}

function ItemMetaLine({ item }: { item: GearItem }) {
  const parts: string[] = [];
  if (typeof item.weight_lbs === "number" && item.weight_lbs > 0) {
    parts.push(`${item.weight_lbs} lbs`);
  }
  if (item.storageLocation) {
    parts.push(item.storageLocation);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <span className="mt-0.5 block truncate text-[0.6rem] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
      {parts.join(" · ")}
    </span>
  );
}

function AffiliateGearLinkButton({
  itemName,
  className = "mr-3",
}: {
  itemName: string;
  className?: string;
}) {
  const url = buildAmazonAffiliateSearchUrl(itemName);
  if (!url) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void openExternalUrl(url);
      }}
      aria-label={`Check price for ${itemName} on Amazon`}
      className={`touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-2.5 py-1 text-[0.65rem] font-semibold text-muted shadow-sm active:scale-[0.97] active:bg-background active:opacity-90 dark:border-border/60 dark:bg-surface/80 dark:text-zinc-300 dark:active:bg-surface ${className}`}
    >
      <ShoppingCart className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>Check Price</span>
    </button>
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
  const { armed, handleClick, ref } = useDestructiveConfirm(() => deleteItem(item.id));

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
          className="touch-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground"
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
          <AffiliateGearLinkButton itemName={name} className="" />
          <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={`touch-target inline-flex shrink-0 items-center justify-center rounded-lg border px-2 active:opacity-90 ${
              armed
                ? "min-w-16 border-red-500 bg-red-50 text-xs font-bold text-red-600"
                : "size-9 border-border text-muted active:text-foreground"
            }`}
            aria-label={armed ? `Confirm delete ${item.name}` : `Delete ${item.name}`}
          >
            {armed ? "Confirm?" : <Trash2 className="size-4" aria-hidden />}
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
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => cycleItemStatus(item.id)}
          aria-label={`${item.name}, ${packStatusLabel(item.status)}. Tap to update.`}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:opacity-90"
        >
          <PackStatusIndicator status={item.status} />
          <span className="min-w-0 flex-1">
            <span
              className={`block text-base font-bold leading-snug ${
                packed
                  ? "text-muted line-through decoration-border dark:text-zinc-500 dark:decoration-zinc-600"
                  : "text-foreground dark:text-white"
              }`}
            >
              {item.name}
            </span>
            <ItemMetaLine item={item} />
          </span>
          <StatusBadge status={item.status} compact />
        </button>
        <AffiliateGearLinkButton itemName={item.name} />
      </div>
    </div>
  );
}
