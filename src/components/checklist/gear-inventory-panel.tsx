"use client";

import { ApplyChecklistPrompt } from "@/components/checklist/apply-checklist-prompt";
import { SaveChecklistTemplate } from "@/components/checklist/save-checklist-template";
import { TemplateCategorySection } from "@/components/checklist/template-editor";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { canCreateTemplate } from "@/lib/pro";
import {
  BUILD_GEAR_CHECKLIST_HINT,
  SAVED_CHECKLISTS_EMPTY_MESSAGE,
  SAVED_CHECKLISTS_HEADER_SUBTITLE,
} from "@/lib/gear-checklist-copy";
import { getTemplateStats } from "@/lib/templates";
import { usePersistedDraft } from "@/hooks/use-persisted-draft";
import type { ChecklistTemplate, TripRecord } from "@/types";
import { ChevronDown, ClipboardList, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface PendingChecklistAction {
  templateId: string;
  templateName: string;
  fromCreate: boolean;
  onEditOnly: () => void;
}

function sortTripsChronologically(trips: TripRecord[]): TripRecord[] {
  return [...trips].sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) {
      return byStart;
    }
    return a.endDate.localeCompare(b.endDate);
  });
}

function SavedChecklistCard({
  template,
  isEditing,
  onEdit,
}: {
  template: ChecklistTemplate;
  isEditing: boolean;
  onEdit: () => void;
}) {
  const { deleteTemplate } = useCampReady();
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
        onClick={() => {
          if (
            window.confirm(
              `Delete checklist "${template.name}"? This cannot be undone.`,
            )
          ) {
            deleteTemplate(template.id);
          }
        }}
        className="touch-target-icon rounded-lg border-2 border-border text-muted active:bg-surface"
        aria-label={`Delete ${template.name}`}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
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
    applyChecklistTemplateToTrip,
    updateTemplate,
    addTemplateCategory,
  } = useCampReady();
  const { isPro, openPaywall } = usePro();

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingChecklistAction | null>(
    null,
  );
  const [newChecklistName, setNewChecklistName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

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

  const template = editingTemplate;
  const editChecklistNameId = useId();

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

  const requestChecklistAction = (
    templateId: string,
    templateName: string,
    onEditOnly: () => void,
    fromCreate = false,
  ) => {
    if (trips.length === 0) {
      onEditOnly();
      openPanel();
      return;
    }

    setPendingAction({
      templateId,
      templateName,
      fromCreate,
      onEditOnly,
    });
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    if (editingTemplateId === template.id) {
      openPanel();
      return;
    }

    requestChecklistAction(template.id, template.name, () => {
      setEditingTemplate(template.id);
    });
  };

  const templateLimitReached = !canCreateTemplate(isPro, templates.length);

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

    requestChecklistAction(
      templateId,
      name,
      () => {
        setEditingTemplate(templateId);
      },
      true,
    );
  };

  const handleApplyToTrip = (tripId: string) => {
    if (!pendingAction) return;

    applyChecklistTemplateToTrip(tripId, pendingAction.templateId, {
      skipConfirm: true,
    });
    setPendingAction(null);
    setEditingTemplate(null);
  };

  const handleEditOnly = () => {
    if (!pendingAction) return;
    pendingAction.onEditOnly();
    setPendingAction(null);
    openPanel();
  };

  const summaryDetail =
    templates.length > 0
      ? `${templates.length} saved checklist${templates.length === 1 ? "" : "s"}`
      : "Build reusable gear lists";

  return (
    <>
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
          <div>
            <p className="text-xs leading-snug text-muted">
              {SAVED_CHECKLISTS_HEADER_SUBTITLE}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {templates.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted">
                  {SAVED_CHECKLISTS_EMPTY_MESSAGE}
                </p>
              ) : (
                templates.map((savedTemplate) => (
                  <SavedChecklistCard
                    key={savedTemplate.id}
                    template={savedTemplate}
                    isEditing={editingTemplateId === savedTemplate.id}
                    onEdit={() => handleEditTemplate(savedTemplate)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border-2 border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 shrink-0 text-accent" aria-hidden />
              <h3 className="text-sm font-bold text-foreground">Build gear checklist</h3>
            </div>
            <p className="mt-1 text-xs leading-snug text-muted">
              {BUILD_GEAR_CHECKLIST_HINT}
            </p>

            {!editingTemplateId || !template ? (
              <div className="mt-3 flex flex-col gap-2">
                <input
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  className="touch-target rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                  placeholder="My Camp Gear"
                  aria-label="New checklist name"
                />
                <button
                  type="button"
                  disabled={!newChecklistName.trim()}
                  onClick={handleCreateChecklist}
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden />
                  Start new gear checklist
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label htmlFor={editChecklistNameId} className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      Checklist name
                    </span>
                    <input
                      id={editChecklistNameId}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleEditNameBlur}
                      className="touch-target rounded-xl border-2 border-border bg-surface px-3 text-sm font-semibold text-foreground"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="touch-target shrink-0 rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground active:opacity-90"
                  >
                    Done
                  </button>
                </div>

                {template.categories.length === 0 ? (
                  <p className="text-sm text-muted">
                    Add a category below, then add gear items under each category.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {template.categories.map((category) => (
                      <TemplateCategorySection
                        key={category.id}
                        templateId={template.id}
                        category={category}
                      />
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-border p-2.5">
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

          <SaveChecklistTemplate />
        </div>
      </details>

      {pendingAction ? (
        <ApplyChecklistPrompt
          templateName={pendingAction.templateName}
          trips={trips}
          defaultTripId={activeTrip?.id ?? trips[0]?.id ?? null}
          onApply={handleApplyToTrip}
          onEditOnly={handleEditOnly}
          onCancel={() => {
            if (pendingAction.fromCreate) {
              setEditingTemplate(null);
            }
            setPendingAction(null);
          }}
        />
      ) : null}
    </>
  );
}
