"use client";

import { AmazonAssociateDisclosure } from "@/components/checklist/amazon-associate-disclosure";
import { CategorySection } from "@/components/checklist/category-section";
import { ExportListButton } from "@/components/checklist/export-list-button";
import {
  ImportListButton,
  type ImportListStatus,
} from "@/components/checklist/import-list-button";
import { FilterToggle } from "@/components/checklist/filter-toggle";
import { GearInventoryPanel } from "@/components/checklist/gear-inventory-panel";
import { DismissibleHint } from "@/components/ui/dismissible-hint";
import { useAppToast } from "@/components/ui/app-toast-provider";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import {
  NO_ACTIVE_TRIP_MESSAGE,
  NO_TRIP_CATEGORIES_MESSAGE,
  PACK_TRIP_HINT,
} from "@/lib/gear-checklist-copy";
import { isGearItemRemaining } from "@/lib/gear-items";
import {
  dismissOnboardingHint,
  isOnboardingHintDismissed,
} from "@/lib/onboarding-hints";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import { Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";

export function ChecklistView() {
  const { activeTrip, activeTripStats, checklistFilter, addCategory } = useCampReady();
  const { isPro, openPaywall } = usePro();
  const { showToast } = useAppToast();
  const newCategoryInputId = useId();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [importStatus, setImportStatus] = useState<ImportListStatus | null>(null);
  const [showCategoryHint, setShowCategoryHint] = useState(
    () => !isOnboardingHintDismissed("checklist-categories"),
  );

  const categories = activeTrip?.categories ?? [];

  const hasRemainingWork = categories.some((category) =>
    category.items.some(isGearItemRemaining),
  );

  const allPacked =
    activeTripStats !== null &&
    activeTripStats.totalItems > 0 &&
    activeTripStats.packedItems === activeTripStats.totalItems;

  useEffect(() => {
    if (!activeTripStats || activeTripStats.totalItems === 0) return;
    if (activeTripStats.percentPacked !== 100) return;
    if (isPro || isPrimeTestLabBypassActive()) return;
    if (isOnboardingHintDismissed("first-trip-packed")) return;

    dismissOnboardingHint("first-trip-packed");
    showToast(
      "All packed! Pro unlocks unlimited trips and saved lists whenever you are ready.",
    );
  }, [activeTripStats, isPro, showToast]);

  const dismissCategoryHint = () => {
    dismissOnboardingHint("checklist-categories");
    setShowCategoryHint(false);
  };

  return (
    <div className="relative min-h-full">
      <GearInventoryPanel />

      {activeTrip ? (
        <section className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2.5 px-1">
            <h2 className="text-base font-bold text-foreground">
              Pack for {activeTrip.name}
            </h2>
            <p className="text-xs leading-relaxed text-muted">{PACK_TRIP_HINT}</p>
            <AmazonAssociateDisclosure className="border-t border-border/50 pt-2.5" />
          </div>

          <div className="rounded-xl border-2 border-border bg-surface px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <ImportListButton
                tripId={activeTrip.id}
                className="relative min-w-0"
                onStatusChange={setImportStatus}
              />
              <ExportListButton trip={activeTrip} className="min-w-0" />
            </div>
            {importStatus ? (
              <p
                role="status"
                className={`mt-2 text-right text-xs font-semibold leading-snug ${
                  importStatus.type === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted"
                }`}
              >
                {importStatus.message}
              </p>
            ) : null}
          </div>

          <FilterToggle />

          {showCategoryHint && categories.length === 0 ? (
            <DismissibleHint onDismiss={dismissCategoryHint}>
              Expand <span className="font-semibold text-foreground">Add category or tote</span>{" "}
              below to start your pack list, or load a saved checklist from Gear inventory.
            </DismissibleHint>
          ) : null}

          <div className="checklist-fab-scroll-padding flex flex-col gap-2.5">
            {categories.length === 0 ? (
              <section className="rounded-xl border-2 border-border bg-surface px-4 py-6 text-center">
                <p className="text-sm text-muted">{NO_TRIP_CATEGORIES_MESSAGE}</p>
              </section>
            ) : (
              categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  filter={checklistFilter}
                />
              ))
            )}

            {checklistFilter === "remaining" && allPacked && !hasRemainingWork ? (
              <section className="rounded-xl border-2 border-border bg-surface px-4 py-8 text-center">
                <p className="text-base font-bold text-foreground">All packed!</p>
                <p className="mt-2 text-sm text-muted">
                  Switch to &ldquo;All&rdquo; to review everything in the vehicle.
                </p>
                {!isPro && !isPrimeTestLabBypassActive() ? (
                  <button
                    type="button"
                    onClick={openPaywall}
                    className="touch-target mt-4 rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground active:opacity-90"
                  >
                    See Lifetime Pro
                  </button>
                ) : null}
              </section>
            ) : null}

            <details className="w-full rounded-xl border border-dashed border-border bg-surface/60">
              <summary className="touch-target cursor-pointer list-none px-4 py-3 text-sm font-semibold text-muted active:text-foreground">
                Add category or tote
              </summary>
              <div className="flex gap-2 border-t border-border/60 px-4 py-3">
                <label htmlFor={newCategoryInputId} className="sr-only">
                  Category or tote name
                </label>
                <input
                  id={newCategoryInputId}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
                  placeholder="Kitchen"
                  aria-label="Category or tote name"
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newCategoryName.trim();
                    if (!name) return;
                    addCategory(name);
                    setNewCategoryName("");
                  }}
                  className="touch-target-icon shrink-0 rounded-lg bg-accent text-accent-foreground active:opacity-90"
                  aria-label="Add category or tote"
                >
                  <Plus className="size-5" aria-hidden />
                </button>
              </div>
            </details>
          </div>
        </section>
      ) : (
        <section className="mt-5 rounded-xl border-2 border-border bg-surface px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">Trip packing</p>
          <p className="mt-2 text-sm leading-snug text-muted">{NO_ACTIVE_TRIP_MESSAGE}</p>
        </section>
      )}
    </div>
  );
}
