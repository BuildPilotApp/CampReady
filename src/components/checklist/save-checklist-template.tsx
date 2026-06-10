"use client";

import { CREATE_GEAR_CHECKLIST_HINT } from "@/lib/gear-checklist-copy";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { canCreateTemplate } from "@/lib/pro";
import { ChevronDown, Save } from "lucide-react";
import { useState } from "react";

export function SaveChecklistTemplate() {
  const { activeTrip, createTemplateFromTrip, database } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const [name, setName] = useState("");

  if (!activeTrip) {
    return null;
  }

  const hasChecklistContent = activeTrip.categories.some(
    (category) => category.items.length > 0,
  );

  return (
    <details className="group rounded-xl border-2 border-border bg-surface">
      <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-foreground active:opacity-90">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Save className="size-5 shrink-0 text-accent" aria-hidden />
          Save trip list to inventory
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
        <p className="text-sm leading-snug text-muted">{CREATE_GEAR_CHECKLIST_HINT}</p>

        {!hasChecklistContent ? (
          <p className="text-sm text-muted">
            Add categories and gear items below before saving to your inventory.
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                Checklist name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base font-semibold text-foreground"
                placeholder="My Camp Setup"
              />
            </label>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => {
                const templateCount = database.templates?.length ?? 0;
                if (!canCreateTemplate(isPro, templateCount)) {
                  openPaywall();
                  return;
                }
                createTemplateFromTrip({
                  tripId: activeTrip.id,
                  name: name.trim(),
                  description: `Gear inventory from ${activeTrip.name}.`,
                });
                setName("");
              }}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="size-5" aria-hidden />
              Save gear checklist
            </button>
          </>
        )}
      </div>
    </details>
  );
}
