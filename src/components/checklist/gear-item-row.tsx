"use client";

import {
  PackStatusIndicator,
  packStatusLabel,
} from "@/components/checklist/pack-status-indicator";
import { useAppToast } from "@/components/ui/app-toast-provider";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePersistedGearItemDraft } from "@/hooks/use-persisted-draft";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { buildAmazonAffiliateSearchUrl } from "@/lib/affiliate-links";
import { openAffiliateUrl } from "@/lib/open-external-url";
import type { GearItem } from "@/types";
import { ShoppingCart, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";

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
    <span className="mt-0.5 block truncate text-xs font-medium leading-snug text-zinc-500 dark:text-zinc-400">
      {parts.join(" · ")}
    </span>
  );
}

function AffiliateGearLinkButton({
  itemName,
  className = "",
}: {
  itemName: string;
  className?: string;
}) {
  const { showToast } = useAppToast();
  const url = buildAmazonAffiliateSearchUrl(itemName);

  const handleOpen = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!url) {
      return;
    }
    const result = await openAffiliateUrl(url);
    if (!result.ok) {
      showToast(result.message, "error");
    }
  };

  return (
    <span
      className={`inline-flex w-10 shrink-0 items-center justify-center ${className}`}
      aria-hidden={!url}
    >
      {url ? (
        <button
          type="button"
          onClick={(event) => void handleOpen(event)}
          aria-label={`Shop for ${itemName} on Amazon`}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted shadow-sm active:scale-[0.97] active:bg-background active:opacity-90 dark:border-border/60 dark:bg-surface/80 dark:text-zinc-300 dark:active:bg-surface"
        >
          <ShoppingCart className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

export function GearItemRow({ item, isEditing = false }: GearItemRowProps) {
  const { cycleItemStatus, updateItem, deleteItem } = useCampReady();
  const packed = item.status === "packed";
  const staged = item.status === "staged";
  const { draft, setField, handleBlur } = usePersistedGearItemDraft({
    item,
    onSave: (patch) => updateItem(item.id, patch),
  });
  const { armed, handleClick, ref } = useDestructiveConfirm(() => deleteItem(item.id));

  if (isEditing) {
    return (
      <div className="border-b border-border/60 bg-background/40 px-4 py-2.5 last:border-b-0">
        <input
          value={draft.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={handleBlur}
          className="touch-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground"
          placeholder="Item name"
        />
        <div className="mt-1.5 flex flex-row items-center gap-2">
          <input
            inputMode="decimal"
            value={draft.weight}
            onChange={(e) => setField("weight", e.target.value)}
            onBlur={handleBlur}
            className="touch-target w-16 shrink-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground"
            placeholder="lbs"
            aria-label="Weight (lbs)"
          />
          <input
            value={draft.storageLocation}
            onChange={(e) => setField("storageLocation", e.target.value)}
            onBlur={handleBlur}
            className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground"
            placeholder="Tote, bin, shelf…"
            aria-label="Storage location"
          />
          <AffiliateGearLinkButton itemName={draft.name} />
          <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={`touch-target-icon shrink-0 rounded-lg border active:opacity-90 ${
              armed
                ? "min-w-16 border-red-500 bg-red-50 px-3 text-xs font-bold text-red-600"
                : "border-border text-muted active:text-foreground"
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
      <div className="flex min-h-16 flex-row items-center">
        <button
          type="button"
          onClick={() => cycleItemStatus(item.id)}
          aria-label={`${item.name}, ${packStatusLabel(item.status)}. Tap to update.`}
          className="flex min-h-16 min-w-0 flex-1 items-center gap-2.5 px-3 text-left active:opacity-90 sm:gap-3"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center sm:size-11">
            <PackStatusIndicator status={item.status} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span
              className={`block truncate text-base font-bold leading-snug ${
                packed
                  ? "text-muted line-through decoration-border dark:text-zinc-500 dark:decoration-zinc-600"
                  : "text-foreground dark:text-white"
              }`}
            >
              {item.name}
            </span>
            <ItemMetaLine item={item} />
          </span>
        </button>
        <div className="flex shrink-0 flex-row items-center gap-1.5 pr-2 sm:gap-2 sm:pr-3">
          <StatusBadge
            status={item.status}
            compact
            className="hidden shrink-0 sm:inline-flex"
          />
          <AffiliateGearLinkButton itemName={item.name} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
