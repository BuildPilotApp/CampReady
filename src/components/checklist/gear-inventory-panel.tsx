"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApplyChecklistPrompt } from "@/components/checklist/apply-checklist-prompt";
import { TemplateCategorySection } from "@/components/checklist/template-editor";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import {
  CREATE_GEAR_CHECKLIST_HINT,
  SAVED_CHECKLISTS_EMPTY_MESSAGE,
  SAVED_CHECKLISTS_HEADER_SUBTITLE,
  STARTER_CHECKLIST_BUTTON_LABEL,
} from "@/lib/gear-checklist-copy";
import { canCreateTemplate, FREE_TEMPLATE_LIMIT, isPrimeTestLabBypassActive } from "@/lib/pro";
import { getTemplateStats } from "@/lib/templates";
import { usePersistedDraft } from "@/hooks/use-persisted-draft";
import type { ChecklistTemplate, TripRecord } from "@/types";
import { DismissibleHint } from "@/components/ui/dismissible-hint";
import {
  dismissOnboardingHint,
  isOnboardingHintDismissed,
} from "@/lib/onboarding-hints";
import {
  ChevronDown,
  Download,
  Layers,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function sortTripsChronologically(trips: TripRecord[]): TripRecord[] {
  return [...trips].sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) {
      return byStart;
    }
    return a.endDate.localeCompare(b.endDate);
  });
}

function SavedChecklistRow({
  template,
  isEditing,
  onEdit,
  onLoad,
}: {
  template: ChecklistTemplate;
  isEditing: boolean;
  onEdit: () => void;
  onLoad: () => void;
}) {
  const { deleteTemplate } = useCampReady();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stats = getTemplateStats(template);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 ${
        isEditing ? "border-accent bg-accent/5" : "border-border bg-background"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">
          {template.name}
        </span>
        <span className="mt-0.5 block text-xs font-semibold text-muted">
          {stats.categoryCount} categor{stats.categoryCount === 1 ? "y" : "ies"}
          {" · "}
          {stats.itemCount} item{stats.itemCount === 1 ? "" : "s"}
        </span>
      </span>
      <button
        type="button"
        onClick={onLoad}
        className="touch-target inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-border px-2.5 py-1.5 text-xs font-bold text-foreground active:opacity-90"
      >
        <Download className="size-3.5" aria-hidden />
        Load
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={`touch-target inline-flex shrink-0 items-center gap-1 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold active:opacity-90 ${
          isEditing
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border text-foreground"
        }`}
      >
        <Pencil className="size-3.5" aria-hidden />
        {isEditing ? "Editing" : "Edit"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="touch-target-icon rounded-lg border-2 border-border text-muted active:bg-surface"
        aria-label={`Delete ${template.name}`}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete checklist?"
        message={`Delete "${template.name}"? This cannot be undone.`}
        confirmLabel="Delete checklist"
        onConfirm={() => {
          deleteTemplate(template.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export function GearInventoryPanel() {
  const {
    database,
    activeTrip,
    editingTemplateId,
    editingTemplate,
    setEditingTemplate,
    createBlankTemplate,
    createStarterChecklist,
    createTemplateFromTrip,
    applyChecklistTemplateToTrip,
    updateTemplate,
    addTemplateCategory,
  } = useCampReady();
  const { isPro, openPaywall } = usePro();

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [loadTemplateId, setLoadTemplateId] = useState<string | null>(null);
  const [newChecklistName, setNewChecklistName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saveTripListName, setSaveTripListName] = useState("");
  const [showInventoryHint, setShowInventoryHint] = useState(
    () => !isOnboardingHintDismissed("gear-inventory"),
  );

  const templates = useMemo(
    () =>
      [...(database.templates ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [database.templates],
  );

  const trips = useMemo(
    () => sortTripsChronologically(database.trips ?? []),
    [database.trips],
  );

  const loadTemplate = loadTemplateId
    ? templates.find((template) => template.id === loadTemplateId)
    : null;

  const template = editingTemplate;
  const editChecklistNameId = useId();
  const saveTripListNameId = useId();

  const { draft: editName, setDraft: setEditName, handleBlur: handleEditNameBlur } =
    usePersistedDraft({
      savedValue: template?.name ?? "",
      resetKey: template?.id ?? "none",
      onSave: (value) => {
        if (!template) return;
        const next = value.trim();
        if (next && next !== template.name) {
          updateTemplate(template.id, { name: next });
        }
      },
    });

  useEffect(() => {
    if (editingTemplateId && detailsRef.current) {
      detailsRef.current.open = true;
    }
  }, [editingTemplateId]);

  const openPanel = () => {
    if (detailsRef.current) {
      detailsRef.current.open = true;
    }
  };

  const templateLimitReached = !canCreateTemplate(isPro, templates.length);
  const showFreePlanTeasers =
    !isPro && !isPrimeTestLabBypassActive();

  const handleCreateChecklist = () => {
    const name = newChecklistName.trim();
    if (!name) return;

    if (templateLimitReached) {
      openPaywall();
      return;
    }

    const templateId = createBlankTemplate(name);
    if (!templateId) return;

    setNewChecklistName("");
    setEditingTemplate(templateId);
    openPanel();
  };

  const handleLoadChecklist = (templateId: string) => {
    if (trips.length === 0) return;

    if (trips.length === 1) {
      applyChecklistTemplateToTrip(trips[0]!.id, templateId);
      return;
    }

    setLoadTemplateId(templateId);
  };

  const handleApplyToTrip = (tripId: string) => {
    if (!loadTemplateId) return;
    applyChecklistTemplateToTrip(tripId, loadTemplateId);
    setLoadTemplateId(null);
  };

  const handleEditTemplate = (savedTemplate: ChecklistTemplate) => {
    if (editingTemplateId === savedTemplate.id) {
      openPanel();
      return;
    }
    setEditingTemplate(savedTemplate.id);
    openPanel();
  };

  const handleSaveTripList = () => {
    if (!activeTrip) return;
    const name = saveTripListName.trim();
    if (!name) return;

    const templateCount = database.templates?.length ?? 0;
    if (!canCreateTemplate(isPro, templateCount)) {
      openPaywall();
      return;
    }

    createTemplateFromTrip({
      tripId: activeTrip.id,
      name,
      description: `Gear inventory from ${activeTrip.name}.`,
    });
    setSaveTripListName("");
  };

  const hasTripChecklistContent =
    activeTrip?.categories.some((category) => category.items.length > 0) ?? false;

  const summaryDetail =
    templates.length > 0
      ? `${templates.length} saved checklist${templates.length === 1 ? "" : "s"}`
      : "Build reusable gear lists";

  return (
    <>
      {showInventoryHint && templates.length === 0 ? (
        <DismissibleHint
          className="mt-1"
          onDismiss={() => {
            dismissOnboardingHint("gear-inventory");
            setShowInventoryHint(false);
          }}
        >
          <span className="font-semibold text-foreground">Gear inventory</span> holds
          reusable checklists you can load onto any trip. Expand it when you are ready
          to save your setup.
        </DismissibleHint>
      ) : null}

      <details
        ref={detailsRef}
        className="group mt-1 rounded-xl border-2 border-border bg-surface"
      >
        <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 active:opacity-90">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Layers className="size-5 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0">
              <span className="block text-base font-bold text-foreground">
                Gear inventory
              </span>
              <span className="block truncate text-xs font-semibold text-muted">
                {summaryDetail}
              </span>
            </span>
          </span>
          <ChevronDown
            className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          {activeTrip && hasTripChecklistContent ? (
            <div className="rounded-xl border-2 border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <Save className="size-5 shrink-0 text-accent" aria-hidden />
                <h3 className="text-sm font-bold text-foreground">
                  Save trip list
                </h3>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted">
                {CREATE_GEAR_CHECKLIST_HINT}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label
                  htmlFor={saveTripListNameId}
                  className="flex min-w-0 flex-1 flex-col gap-1"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">
                    Checklist name
                  </span>
                  <input
                    id={saveTripListNameId}
                    value={saveTripListName}
                    onChange={(e) => setSaveTripListName(e.target.value)}
                    className="touch-target rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                    placeholder="My Camp Setup"
                  />
                </label>
                <button
                  type="button"
                  disabled={!saveTripListName.trim()}
                  onClick={handleSaveTripList}
                  className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" aria-hidden />
                  Save
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs leading-snug text-muted">
                {SAVED_CHECKLISTS_HEADER_SUBTITLE}
              </p>
              {!showFreePlanTeasers ? null : templates.length >= FREE_TEMPLATE_LIMIT ? (
                <p className="shrink-0 text-xs font-medium text-muted">
                  {templates.length} of {FREE_TEMPLATE_LIMIT}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {templates.length === 0 ? (
                <>
                  <p className="text-sm leading-relaxed text-muted">
                    {SAVED_CHECKLISTS_EMPTY_MESSAGE}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (templateLimitReached) {
                        openPaywall();
                        return;
                      }
                      createStarterChecklist();
                      openPanel();
                    }}
                    className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground active:opacity-90"
                  >
                    <Sparkles className="size-4 text-accent" aria-hidden />
                    {STARTER_CHECKLIST_BUTTON_LABEL}
                  </button>
                </>
              ) : (
                templates.map((savedTemplate) => (
                  <SavedChecklistRow
                    key={savedTemplate.id}
                    template={savedTemplate}
                    isEditing={editingTemplateId === savedTemplate.id}
                    onEdit={() => handleEditTemplate(savedTemplate)}
                    onLoad={() => handleLoadChecklist(savedTemplate.id)}
                  />
                ))
              )}
            </div>
          </div>

          {!editingTemplateId || !template ? (
            <div className="rounded-xl border-2 border-border bg-background p-4">
              <h3 className="text-sm font-bold text-foreground">New checklist</h3>
              <p className="mt-1 text-xs leading-snug text-muted">
                Create a reusable gear list to load onto future trips.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <input
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  className="touch-target min-w-0 flex-1 rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                  placeholder="My Camp Gear"
                  aria-label="New checklist name"
                />
                <button
                  type="button"
                  disabled={!newChecklistName.trim()}
                  onClick={handleCreateChecklist}
                  className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden />
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-accent/40 bg-background p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label
                  htmlFor={editChecklistNameId}
                  className="flex min-w-0 flex-1 flex-col gap-1"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">
                    Editing checklist
                  </span>
                  <input
                    id={editChecklistNameId}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleEditNameBlur}
                    className="touch-target rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                  />
                </label>
                <div className="flex shrink-0 gap-2">
                  {activeTrip ? (
                    <button
                      type="button"
                      onClick={() => handleLoadChecklist(template.id)}
                      className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground active:opacity-90"
                    >
                      <Download className="size-4" aria-hidden />
                      Load to trip
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="touch-target rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground active:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>

              {template.categories.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Add a category below, then add gear items under each category.
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {template.categories.map((category) => (
                    <TemplateCategorySection
                      key={category.id}
                      templateId={template.id}
                      category={category}
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-lg border border-dashed border-border p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Add category or tote
                </p>
                <div className="mt-1.5 flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="touch-target min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
                    placeholder="Kitchen"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = newCategoryName.trim();
                      if (!next) return;
                      addTemplateCategory(template.id, next);
                      setNewCategoryName("");
                    }}
                    className="touch-target-icon rounded-lg bg-accent text-accent-foreground active:opacity-90"
                    aria-label="Add category"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {loadTemplate ? (
        <ApplyChecklistPrompt
          templateName={loadTemplate.name}
          trips={trips}
          defaultTripId={activeTrip?.id ?? trips[0]?.id ?? null}
          onApply={handleApplyToTrip}
          onCancel={() => setLoadTemplateId(null)}
        />
      ) : null}
    </>
  );
}
