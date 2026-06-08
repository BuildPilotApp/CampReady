"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { ChecklistFilter, GearItem } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface GearItemRowProps {
  item: GearItem;
  filter: ChecklistFilter;
}

export function GearItemRow({ item, filter }: GearItemRowProps) {
  const {
    cycleItemStatus,
    updateItem,
    deleteItem,
    addSubItem,
    updateSubItem,
    deleteSubItem,
    cycleSubItemStatus,
  } = useCampReady();
  const packed = item.status === "packed";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [weight, setWeight] = useState(
    typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "",
  );
  const [storageLocation, setStorageLocation] = useState(item.storageLocation ?? "");
  const [isContainer, setIsContainer] = useState(Boolean(item.isContainer));
  const [newSubItemName, setNewSubItemName] = useState("");

  const visibleSubItems =
    filter === "remaining"
      ? (item.subItems ?? []).filter((sub) => sub.status !== "packed")
      : (item.subItems ?? []);

  const subItemCount = item.subItems?.length ?? 0;
  const packedSubCount =
    item.subItems?.filter((sub) => sub.status === "packed").length ?? 0;

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
            {item.isContainer ? (
              <span className="mt-0.5 block text-xs font-bold uppercase tracking-wide text-accent">
                Container{item.subItems?.length ? ` · ${packedSubCount}/${subItemCount} packed` : ""}
              </span>
            ) : null}
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

      {visibleSubItems.length > 0 ? (
        <div className="border-t border-border bg-background/50">
          {visibleSubItems.map((subItem) => {
            const subPacked = subItem.status === "packed";
            return (
              <div
                key={subItem.id}
                className="flex items-stretch gap-3 border-t border-border/70 px-4 py-2.5 pl-8 first:border-t-0"
              >
                <button
                  type="button"
                  onClick={() => cycleSubItemStatus(item.id, subItem.id)}
                  aria-label={`${subItem.name}, ${subItem.status}. Tap to change status.`}
                  className="flex min-h-12 flex-1 items-center gap-3 text-left active:opacity-90"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold leading-snug text-foreground ${
                        subPacked ? "line-through opacity-70" : ""
                      }`}
                    >
                      {subItem.name}
                    </span>
                  </span>
                  <StatusBadge status={subItem.status} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

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

            <label className="flex items-start gap-3 rounded-xl border-2 border-border bg-background px-3 py-3">
              <input
                type="checkbox"
                checked={isContainer}
                onChange={(e) => setIsContainer(e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-accent"
              />
              <span>
                <span className="block text-sm font-bold text-foreground">
                  Container with sub-items
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  For totes, bins, or kits that hold multiple items inside.
                </span>
              </span>
            </label>

            {isContainer ? (
              <div className="rounded-xl border-2 border-border bg-background p-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  Sub-items
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {(item.subItems ?? []).map((subItem) => (
                    <li key={subItem.id} className="flex items-center gap-2">
                      <input
                        defaultValue={subItem.name}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (next && next !== subItem.name) {
                            updateSubItem(item.id, subItem.id, { name: next });
                          }
                        }}
                        className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove "${subItem.name}" from this container?`)) {
                            deleteSubItem(item.id, subItem.id);
                          }
                        }}
                        className="touch-target inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-surface text-foreground active:opacity-90"
                        aria-label={`Delete ${subItem.name}`}
                      >
                        <Trash2 className="size-4 text-muted" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newSubItemName}
                    onChange={(e) => setNewSubItemName(e.target.value)}
                    className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                    placeholder="e.g. Cooking oil"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = newSubItemName.trim();
                      if (!next) return;
                      addSubItem({ itemId: item.id, name: next });
                      setNewSubItemName("");
                    }}
                    className="touch-target inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground active:opacity-90"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const weightValue = Number.parseFloat(weight);
                updateItem(item.id, {
                  name: name.trim() || item.name,
                  weight_lbs: Number.isFinite(weightValue) ? weightValue : undefined,
                  storageLocation: storageLocation.trim() || undefined,
                  isContainer: isContainer || undefined,
                  subItems: isContainer ? item.subItems ?? [] : undefined,
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
