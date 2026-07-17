"use client";

import { nextGearStatus } from "@/lib/gear-status";
import type { ChecklistExportCategory } from "@/lib/checklist-export-format";
import {
  mergeImportedCategories,
  type ImportMergeResult,
} from "@/lib/import-checklist";
import { cloneCategories, clearDatabase, createCategory, createGearItem, createTrip, createEmptyDatabase, ensureSeededDatabase, getTripStats, hasValidLocalStorageSnapshot, hydrateDatabase, readDatabaseSync, touchTrip, writeDatabaseSync, type HydrationRecoveryReason } from "@/lib/storage";
import { dismissWelcome } from "@/lib/onboarding";
import {
  buildStarterCategories,
  STARTER_CHECKLIST_NAME,
  STARTER_TRIP_NAME,
} from "@/lib/starter-checklist";
import {
  clearUiSessionState,
  DEFAULT_CATEGORY_COLLAPSED,
  readUiSessionState,
  scheduleWriteUiSessionState,
} from "@/lib/storage/ui-session-state";
import { flushPendingFeedbackSubmissions } from "@/lib/feedback-submission";
import { onReturnToForeground } from "@/lib/runtime/app-power-mode";
import { isNetworkAvailable } from "@/lib/runtime/network-guard";
import {
  CUSTOM_TEMPLATE_ID,
} from "@/lib/templates";
import { formatLocalIsoDate } from "@/lib/date-utils";
import type {
  AppTab,
  CampReadyDatabase,
  ChecklistFilter,
  ChecklistTemplate,
  GearItem,
  GearItemStatus,
  InfoView,
  MealPrepItem,
  TripRecord,
  TripLocation,
  VehiclePayloadSettings,
} from "@/types";
import {
  addMealItemToDays,
  deleteMealItemFromDays,
  toggleMealItemStatusInDays,
  updateMealItemInDays,
} from "@/lib/meal-prep";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface CampReadyContextValue {
  ready: boolean;
  database: CampReadyDatabase;
  activeTrip: TripRecord | null;
  activeTripStats: {
    totalItems: number;
    packedItems: number;
    totalWeightLbs: number;
    percentPacked: number;
  } | null;
  activeTab: AppTab;
  infoView: InfoView | null;
  checklistFilter: ChecklistFilter;
  collapsedCategories: Record<string, boolean>;
  setActiveTab: (tab: AppTab) => void;
  setInfoView: (view: InfoView | null) => void;
  openInfoMenu: () => void;
  closeInfo: () => void;
  setChecklistFilter: (filter: ChecklistFilter) => void;
  toggleCategory: (categoryId: string) => void;
  selectTrip: (tripId: string) => void;
  createNewTrip: (input: {
    name: string;
    startDate: string;
    endDate: string;
    location?: TripLocation;
    templateId: string;
  }) => void;
  updateTrip: (
    tripId: string,
    patch: Partial<Pick<TripRecord, "name" | "startDate" | "endDate" | "location">>,
  ) => void;
  deleteTrip: (tripId: string) => void;

  editingTemplateId: string | null;
  editingTemplate: ChecklistTemplate | null;
  setEditingTemplate: (templateId: string | null) => void;
  createBlankTemplate: (name: string) => string | undefined;

  createTemplateFromTrip: (input: {
    tripId: string;
    name: string;
    description: string;
  }) => void;

  applyChecklistTemplateToTrip: (
    tripId: string,
    templateId: string,
  ) => void;

  createStarterTrip: () => void;
  createStarterChecklist: () => string | undefined;

  updateTemplate: (
    templateId: string,
    patch: Partial<Pick<ChecklistTemplate, "name" | "description">>,
  ) => void;
  deleteTemplate: (templateId: string) => void;
  addTemplateCategory: (templateId: string, name: string) => void;
  updateTemplateCategory: (
    templateId: string,
    categoryId: string,
    name: string,
  ) => void;
  deleteTemplateCategory: (templateId: string, categoryId: string) => void;
  addTemplateItem: (input: {
    templateId: string;
    categoryId: string;
    name: string;
    weight_lbs?: number;
    storageLocation?: string;
  }) => void;
  updateTemplateItem: (
    templateId: string,
    itemId: string,
    patch: Partial<Pick<GearItem, "name" | "weight_lbs" | "storageLocation">>,
  ) => void;
  deleteTemplateItem: (templateId: string, itemId: string) => void;

  addCategory: (name: string) => void;
  updateCategory: (categoryId: string, name: string) => void;
  deleteCategory: (categoryId: string) => void;

  addItem: (input: {
    categoryId: string;
    name: string;
    weight_lbs?: number;
    storageLocation?: string;
  }) => void;
  addChecklistItem: (input: {
    categoryId?: string;
    categoryName?: string;
    name: string;
    weight_lbs?: number;
    storageLocation?: string;
  }) => { itemName: string; categoryId: string; categoryName: string } | null;
  updateItem: (itemId: string, patch: Partial<Omit<GearItem, "id" | "category">>) => void;
  deleteItem: (itemId: string) => void;
  cycleItemStatus: (itemId: string) => void;
  resetAllItems: () => void;
  importChecklistIntoTrip: (
    tripId: string,
    categories: ChecklistExportCategory[],
  ) => ImportMergeResult | null;
  storageRecovery: HydrationRecoveryReason | null;
  dismissStorageRecovery: () => void;
  resetAllData: () => void;
  restoreBackupCategories: (
    categories: ChecklistExportCategory[],
  ) => ImportMergeResult | null;
  updateVehiclePayloadSettings: (
    patch: Partial<VehiclePayloadSettings>,
  ) => void;
  addMealPrepItem: (
    dayNumber: number,
    title: string,
    recipeNotes?: string,
  ) => void;
  updateMealPrepItem: (
    dayNumber: number,
    itemId: string,
    patch: Partial<Pick<MealPrepItem, "title" | "status" | "recipeNotes">>,
  ) => void;
  toggleMealPrepItemStatus: (dayNumber: number, itemId: string) => void;
  deleteMealPrepItem: (dayNumber: number, itemId: string) => void;
}

const CampReadyContext = createContext<CampReadyContextValue | null>(null);

function normalizeLocation(query?: string): TripLocation | undefined {
  const trimmed = query?.trim();
  if (!trimmed) return undefined;
  return { query: trimmed };
}

function resolveChecklistTemplate(
  database: CampReadyDatabase,
  templateId: string,
): ChecklistTemplate | undefined {
  if (templateId === CUSTOM_TEMPLATE_ID) {
    return undefined;
  }

  return database.templates.find((template) => template.id === templateId);
}

function updateTripById(
  database: CampReadyDatabase,
  tripId: string,
  updater: (trip: TripRecord) => TripRecord,
): CampReadyDatabase {
  const idx = database.trips.findIndex((trip) => trip.id === tripId);
  if (idx === -1) return database;
  const trips = [...database.trips];
  trips[idx] = touchTrip(updater(trips[idx]!));
  return { ...database, trips };
}

function updateTemplateById(
  database: CampReadyDatabase,
  templateId: string,
  updater: (template: ChecklistTemplate) => ChecklistTemplate,
): CampReadyDatabase {
  const idx = database.templates.findIndex((template) => template.id === templateId);
  if (idx === -1) return database;
  const templates = [...database.templates];
  templates[idx] = updater(templates[idx]!);
  return { ...database, templates };
}

function clearTripChecklistTemplateId(
  trip: TripRecord,
): TripRecord {
  return trip.checklistTemplateId
    ? { ...trip, checklistTemplateId: undefined }
    : trip;
}

function clearTripsForTemplate(
  database: CampReadyDatabase,
  templateId: string,
): CampReadyDatabase {
  return {
    ...database,
    trips: database.trips.map((trip) =>
      trip.checklistTemplateId === templateId
        ? touchTrip({ ...trip, checklistTemplateId: undefined })
        : trip,
    ),
  };
}

export function CampReadyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    () => typeof window !== "undefined",
  );
  const [database, setDatabase] = useState<CampReadyDatabase | null>(() =>
    typeof window !== "undefined" ? readDatabaseSync() : null,
  );
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [infoView, setInfoView] = useState<InfoView | null>(null);
  const [checklistFilter, setChecklistFilter] =
    useState<ChecklistFilter>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [storageRecovery, setStorageRecovery] =
    useState<HydrationRecoveryReason | null>(null);
  const [uiSessionHydrated, setUiSessionHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!database) {
      const syncDb = readDatabaseSync();
      setDatabase(syncDb);
      setReady(true);
    }

    void hydrateDatabase()
      .then((result) => {
        if (cancelled) {
          return;
        }

        const shouldApply =
          result.recovered || !hasValidLocalStorageSnapshot();
        if (shouldApply) {
          setDatabase(result.database);
        }
        if (result.recovered && result.reason) {
          setStorageRecovery(result.reason);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        if (!hasValidLocalStorageSnapshot()) {
          const fallback = ensureSeededDatabase(createEmptyDatabase());
          setDatabase(fallback);
          setStorageRecovery("error");
          try {
            writeDatabaseSync(fallback);
          } catch {
            // In-memory state is usable even if disk write fails.
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || uiSessionHydrated) {
      return;
    }

    const session = readUiSessionState();
    if (session.activeTab) {
      setActiveTab(session.activeTab);
    }
    if (session.checklistFilter) {
      setChecklistFilter(session.checklistFilter);
    }
    if (session.collapsedCategories) {
      setCollapsedCategories(session.collapsedCategories);
    }
    setUiSessionHydrated(true);
  }, [ready, uiSessionHydrated]);

  useEffect(() => {
    if (!ready || !uiSessionHydrated) {
      return;
    }

    scheduleWriteUiSessionState({
      activeTab,
      checklistFilter,
      collapsedCategories,
    });
  }, [ready, uiSessionHydrated, activeTab, checklistFilter, collapsedCategories]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const flushQueue = () => {
      if (!isNetworkAvailable() || document.visibilityState === "hidden") {
        return;
      }
      void flushPendingFeedbackSubmissions();
    };

    const unsubscribeForeground = onReturnToForeground(flushQueue);
    window.addEventListener("online", flushQueue);
    return () => {
      unsubscribeForeground();
      window.removeEventListener("online", flushQueue);
    };
  }, [ready]);

  const persist = useCallback((next: CampReadyDatabase) => {
    setDatabase(next);
    try {
      writeDatabaseSync(next);
    } catch {
      // Storage writes are best-effort; in-memory state already updated for the UI.
    }
  }, []);

  const activeTrip = useMemo<TripRecord | null>(() => {
    if (!database?.activeTripId) return null;
    return database.trips.find((trip) => trip.id === database.activeTripId) ?? null;
  }, [database]);

  const activeTripStats = useMemo(() => {
    if (!activeTrip) return null;
    return getTripStats(activeTrip);
  }, [activeTrip]);

  const editingTemplate = useMemo<ChecklistTemplate | null>(() => {
    if (!database?.templates || !editingTemplateId) return null;
    return (
      database.templates.find((template) => template.id === editingTemplateId) ??
      null
    );
  }, [database, editingTemplateId]);

  useEffect(() => {
    if (editingTemplateId && !editingTemplate) {
      setEditingTemplateId(null);
    }
  }, [editingTemplateId, editingTemplate]);

  const setEditingTemplate = useCallback((templateId: string | null) => {
    setEditingTemplateId(templateId);
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((current) => ({
      ...current,
      [categoryId]: !(current[categoryId] ?? DEFAULT_CATEGORY_COLLAPSED),
    }));
  }, []);

  const selectTrip = useCallback(
    (tripId: string) => {
      if (!database) return;
      if (database.activeTripId === tripId) return;
      persist({ ...database, activeTripId: tripId });
      setCollapsedCategories({});
      setChecklistFilter("all");
    },
    [database, persist],
  );

  const openInfoMenu = useCallback(() => {
    setInfoView("menu");
  }, []);

  const closeInfo = useCallback(() => {
    setInfoView(null);
  }, []);

  const createNewTrip = useCallback(
    (input: {
      name: string;
      startDate: string;
      endDate: string;
      location?: TripLocation;
      templateId: string;
    }) => {
      if (!database) return;

      const template = resolveChecklistTemplate(database, input.templateId);
      const categories = template ? cloneCategories(template.categories) : [];

      const trip: TripRecord = {
        ...createTrip({
          name: input.name.trim() || "New Trip",
          startDate: input.startDate,
          endDate: input.endDate,
          location: input.location?.query?.trim()
            ? input.location
            : undefined,
        }),
        categories,
        checklistTemplateId: template?.id,
      };

      const next = {
        ...database,
        trips: [trip, ...database.trips],
        activeTripId: trip.id,
      };
      persist(next);
      setActiveTab("checklist");
      setCollapsedCategories({});
      setChecklistFilter("all");
      dismissWelcome();
    },
    [database, persist],
  );

  const updateTrip = useCallback(
    (
      tripId: string,
      patch: Partial<
        Pick<TripRecord, "name" | "startDate" | "endDate" | "location">
      >,
    ) => {
      if (!database) return;
      persist(
        updateTripById(database, tripId, (trip) => ({
          ...trip,
          ...patch,
        })),
      );
    },
    [database, persist],
  );

  const deleteTrip = useCallback(
    (tripId: string) => {
      if (!database) return;
      const trips = database.trips.filter((trip) => trip.id !== tripId);
      const activeTripId =
        database.activeTripId === tripId ? trips[0]?.id ?? null : database.activeTripId;
      persist({ ...database, trips, activeTripId });
      setCollapsedCategories({});
      setChecklistFilter("all");
    },
    [database, persist],
  );

  const createBlankTemplate = useCallback(
    (name: string) => {
      if (!database) return undefined;

      const template: ChecklistTemplate = {
        id: crypto.randomUUID(),
        name: name.trim() || "New Gear Checklist",
        description: "Reusable gear inventory for trips.",
        categories: [],
      };

      persist({ ...database, templates: [template, ...database.templates] });
      setEditingTemplateId(template.id);
      return template.id;
    },
    [database, persist],
  );

  const createTemplateFromTrip = useCallback(
    (input: { tripId: string; name: string; description: string }) => {
      if (!database) return;
      const trip = database.trips.find((t) => t.id === input.tripId);
      if (!trip) return;

      const template: ChecklistTemplate = {
        id: crypto.randomUUID(),
        name: input.name.trim() || "My Gear Checklist",
        description:
          input.description.trim() || "Reusable gear inventory for trips.",
        categories: cloneCategories(trip.categories),
      };

      persist(
        updateTripById(
          { ...database, templates: [template, ...database.templates] },
          input.tripId,
          (currentTrip) => ({
            ...currentTrip,
            checklistTemplateId: template.id,
          }),
        ),
      );
    },
    [database, persist],
  );

  const applyChecklistTemplateToTrip = useCallback(
    (tripId: string, templateId: string) => {
      if (!database) return;
      const trip = database.trips.find((t) => t.id === tripId);
      if (!trip) return;

      const template = resolveChecklistTemplate(database, templateId);
      const categories = template ? cloneCategories(template.categories) : [];

      persist({
        ...updateTripById(database, tripId, (currentTrip) => ({
          ...currentTrip,
          categories,
          checklistTemplateId: template?.id,
        })),
        activeTripId: tripId,
      });
      setCollapsedCategories({});
      setChecklistFilter("all");
    },
    [database, persist],
  );

  const createStarterTrip = useCallback(() => {
    if (!database) return;

    const startDate = formatLocalIsoDate(new Date());
    const end = new Date();
    end.setDate(end.getDate() + 2);
    const endDate = formatLocalIsoDate(end);

    const trip: TripRecord = {
      ...createTrip({
        name: STARTER_TRIP_NAME,
        startDate,
        endDate,
      }),
      categories: cloneCategories(buildStarterCategories()),
    };

    persist({
      ...database,
      trips: [trip, ...database.trips],
      activeTripId: trip.id,
    });
    setActiveTab("checklist");
    setCollapsedCategories({});
    setChecklistFilter("all");
    dismissWelcome();
  }, [database, persist]);

  const createStarterChecklist = useCallback(() => {
    if (!database) return undefined;

    const template: ChecklistTemplate = {
      id: crypto.randomUUID(),
      name: STARTER_CHECKLIST_NAME,
      description: "Example categories and gear for a quick getaway trip.",
      categories: cloneCategories(buildStarterCategories()),
    };

    persist({ ...database, templates: [template, ...database.templates] });
    setEditingTemplateId(template.id);
    dismissWelcome();
    return template.id;
  }, [database, persist]);

  const updateTemplate = useCallback(
    (
      templateId: string,
      patch: Partial<Pick<ChecklistTemplate, "name" | "description">>,
    ) => {
      if (!database) return;
      persist(
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          ...patch,
        })),
      );
    },
    [database, persist],
  );

  const deleteTemplate = useCallback(
    (templateId: string) => {
      if (!database) return;
      persist({
        ...database,
        templates: database.templates.filter(
          (template) => template.id !== templateId,
        ),
        trips: clearTripsForTemplate(database, templateId).trips,
      });
      setEditingTemplateId((current) =>
        current === templateId ? null : current,
      );
    },
    [database, persist],
  );

  const addTemplateCategory = useCallback(
    (templateId: string, name: string) => {
      if (!database) return;
      const category = createCategory({ name: name.trim() || "New Category" });
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, templateId, (template) => ({
            ...template,
            categories: [...template.categories, category],
          })),
          templateId,
        ),
      );
    },
    [database, persist],
  );

  const updateTemplateCategory = useCallback(
    (templateId: string, categoryId: string, name: string) => {
      if (!database) return;
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, templateId, (template) => ({
            ...template,
            categories: template.categories.map((category) =>
              category.id === categoryId ? { ...category, name } : category,
            ),
          })),
          templateId,
        ),
      );
    },
    [database, persist],
  );

  const deleteTemplateCategory = useCallback(
    (templateId: string, categoryId: string) => {
      if (!database) return;
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, templateId, (template) => ({
            ...template,
            categories: template.categories.filter(
              (category) => category.id !== categoryId,
            ),
          })),
          templateId,
        ),
      );
    },
    [database, persist],
  );

  const addTemplateItem = useCallback(
    (input: {
      templateId: string;
      categoryId: string;
      name: string;
      weight_lbs?: number;
      storageLocation?: string;
    }) => {
      if (!database) return;
      const item = createGearItem({
        name: input.name.trim() || "New Item",
        category: input.categoryId,
        weight_lbs: input.weight_lbs,
        storageLocation: input.storageLocation,
      });
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, input.templateId, (template) => ({
            ...template,
            categories: template.categories.map((category) =>
              category.id === input.categoryId
                ? { ...category, items: [item, ...category.items] }
                : category,
            ),
          })),
          input.templateId,
        ),
      );
    },
    [database, persist],
  );

  const updateTemplateItem = useCallback(
    (
      templateId: string,
      itemId: string,
      patch: Partial<Pick<GearItem, "name" | "weight_lbs" | "storageLocation">>,
    ) => {
      if (!database) return;
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, templateId, (template) => ({
            ...template,
            categories: template.categories.map((category) => ({
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            })),
          })),
          templateId,
        ),
      );
    },
    [database, persist],
  );

  const deleteTemplateItem = useCallback(
    (templateId: string, itemId: string) => {
      if (!database) return;
      persist(
        clearTripsForTemplate(
          updateTemplateById(database, templateId, (template) => ({
            ...template,
            categories: template.categories.map((category) => ({
              ...category,
              items: category.items.filter((item) => item.id !== itemId),
            })),
          })),
          templateId,
        ),
      );
    },
    [database, persist],
  );

  const addCategory = useCallback(
    (name: string) => {
      if (!database?.activeTripId) return;
      const category = createCategory({ name: name.trim() || "New Category" });
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: [...trip.categories, category],
        })),
      );
      setChecklistFilter("all");
      setCollapsedCategories((current) => ({ ...current, [category.id]: false }));
    },
    [database, persist],
  );

  const updateCategory = useCallback(
    (categoryId: string, name: string) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: trip.categories.map((c) =>
            c.id === categoryId ? { ...c, name } : c,
          ),
        })),
      );
    },
    [database, persist],
  );

  const deleteCategory = useCallback(
    (categoryId: string) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: trip.categories.filter((c) => c.id !== categoryId),
        })),
      );
      setCollapsedCategories((current) => {
        const next = { ...current };
        delete next[categoryId];
        return next;
      });
    },
    [database, persist],
  );

  const addItem = useCallback(
    (input: { categoryId: string; name: string; weight_lbs?: number; storageLocation?: string }) => {
      if (!database?.activeTripId) return;
      const item = createGearItem({
        name: input.name.trim() || "New Item",
        category: input.categoryId,
        weight_lbs: input.weight_lbs,
        storageLocation: input.storageLocation?.trim() || undefined,
      });
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: trip.categories.map((c) =>
            c.id === input.categoryId ? { ...c, items: [item, ...c.items] } : c,
          ),
        })),
      );
    },
    [database, persist],
  );

  const addChecklistItem = useCallback(
    (input: {
      categoryId?: string;
      categoryName?: string;
      name: string;
      weight_lbs?: number;
      storageLocation?: string;
    }) => {
      if (!database?.activeTripId) return null;

      const itemName = input.name.trim() || "New Item";
      const requestedCategoryName = input.categoryName?.trim() || "Gear";
      let targetCategoryId = input.categoryId;
      let targetCategoryName = requestedCategoryName;

      persist(
        updateTripById(database, database.activeTripId, (trip) => {
          const existingCategory = targetCategoryId
            ? trip.categories.find((category) => category.id === targetCategoryId)
            : undefined;
          const category = existingCategory ?? createCategory({ name: requestedCategoryName });
          targetCategoryId = category.id;
          targetCategoryName = category.name;

          const item = createGearItem({
            name: itemName,
            category: category.id,
            weight_lbs: input.weight_lbs,
            storageLocation: input.storageLocation?.trim() || undefined,
          });

          return {
            ...clearTripChecklistTemplateId(trip),
            categories: existingCategory
              ? trip.categories.map((currentCategory) =>
                  currentCategory.id === category.id
                    ? { ...currentCategory, items: [item, ...currentCategory.items] }
                    : currentCategory,
                )
              : [...trip.categories, { ...category, items: [item] }],
          };
        }),
      );

      setChecklistFilter("all");
      setCollapsedCategories((current) => ({
        ...current,
        [targetCategoryId!]: false,
      }));

      return { itemName, categoryId: targetCategoryId!, categoryName: targetCategoryName };
    },
    [database, persist],
  );

  const updateItem = useCallback(
    (itemId: string, patch: Partial<Omit<GearItem, "id" | "category">>) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: trip.categories.map((c) => ({
            ...c,
            items: c.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
          })),
        })),
      );
    },
    [database, persist],
  );

  const deleteItem = useCallback(
    (itemId: string) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...clearTripChecklistTemplateId(trip),
          categories: trip.categories.map((c) => ({
            ...c,
            items: c.items.filter((item) => item.id !== itemId),
          })),
        })),
      );
    },
    [database, persist],
  );

  const cycleItemStatus = useCallback(
    (itemId: string) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...trip,
          categories: trip.categories.map((c) => ({
            ...c,
            items: c.items.map((item) =>
              item.id === itemId ? { ...item, status: nextGearStatus(item.status) } : item,
            ),
          })),
        })),
      );
    },
    [database, persist],
  );

  const resetAllItems = useCallback(() => {
    if (!database?.activeTripId) return;

    persist(
      updateTripById(database, database.activeTripId, (trip) => ({
        ...trip,
        categories: trip.categories.map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            status: "missing" as GearItemStatus,
          })),
        })),
      })),
    );
  }, [database, persist]);

  const importChecklistIntoTrip = useCallback(
    (tripId: string, categories: ChecklistExportCategory[]) => {
      if (!database) return null;

      const trip = database.trips.find((entry) => entry.id === tripId);
      if (!trip) return null;

      const result = mergeImportedCategories(trip.categories, categories);
      persist(
        updateTripById(database, tripId, (currentTrip) => ({
          ...currentTrip,
          categories: result.categories,
          checklistTemplateId: undefined,
        })),
      );
      setChecklistFilter("all");
      return result;
    },
    [database, persist],
  );

  const dismissStorageRecovery = useCallback(() => {
    setStorageRecovery(null);
  }, []);

  const resetAllData = useCallback(() => {
    const empty = ensureSeededDatabase(createEmptyDatabase());
    clearDatabase();
    clearUiSessionState();
    persist(empty);
    setCollapsedCategories({});
    setChecklistFilter("all");
    setEditingTemplateId(null);
    setActiveTab("dashboard");
    setUiSessionHydrated(true);
  }, [persist]);

  const restoreBackupCategories = useCallback(
    (categories: ChecklistExportCategory[]) => {
      if (!database) return null;

      let workingDatabase = database;
      let tripId = database.activeTripId ?? database.trips[0]?.id ?? null;

      if (!tripId) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        const iso = startDate.toISOString().slice(0, 10);
        const trip: TripRecord = {
          ...createTrip({
            name: "Restored trip",
            startDate: iso,
            endDate: iso,
          }),
          categories: [],
        };
        tripId = trip.id;
        workingDatabase = {
          ...database,
          trips: [trip, ...database.trips],
          activeTripId: tripId,
        };
      }

      const trip = workingDatabase.trips.find((entry) => entry.id === tripId);
      if (!trip) return null;

      const result = mergeImportedCategories(trip.categories, categories);
      persist(
        updateTripById(workingDatabase, tripId, (currentTrip) => ({
          ...currentTrip,
          categories: result.categories,
          checklistTemplateId: undefined,
        })),
      );
      setActiveTab("checklist");
      setChecklistFilter("all");
      return result;
    },
    [database, persist],
  );

  const updateVehiclePayloadSettings = useCallback(
    (patch: Partial<VehiclePayloadSettings>) => {
      if (!database) return;

      const current = database.vehiclePayload ?? { alarmEnabled: false };
      const next: VehiclePayloadSettings = {
        alarmEnabled:
          typeof patch.alarmEnabled === "boolean"
            ? patch.alarmEnabled
            : current.alarmEnabled,
      };

      if ("maxPayloadCapacityLbs" in patch) {
        const capacity = patch.maxPayloadCapacityLbs;
        if (typeof capacity === "number" && Number.isFinite(capacity) && capacity > 0) {
          next.maxPayloadCapacityLbs = capacity;
        }
      } else if (
        typeof current.maxPayloadCapacityLbs === "number" &&
        current.maxPayloadCapacityLbs > 0
      ) {
        next.maxPayloadCapacityLbs = current.maxPayloadCapacityLbs;
      }

      persist({
        ...database,
        vehiclePayload: next,
      });
    },
    [database, persist],
  );

  const addMealPrepItem = useCallback(
    (dayNumber: number, title: string, recipeNotes?: string) => {
      if (!database?.activeTripId) return;
      const tripId = database.activeTripId;
      persist(
        updateTripById(database, tripId, (trip) => ({
          ...trip,
          mealPrepDays: addMealItemToDays(
            trip.mealPrepDays,
            dayNumber,
            title,
            recipeNotes,
          ),
        })),
      );
    },
    [database, persist],
  );

  const updateMealPrepItem = useCallback(
    (
      dayNumber: number,
      itemId: string,
      patch: Partial<Pick<MealPrepItem, "title" | "status" | "recipeNotes">>,
    ) => {
      if (!database?.activeTripId) return;
      const tripId = database.activeTripId;
      persist(
        updateTripById(database, tripId, (trip) => ({
          ...trip,
          mealPrepDays: updateMealItemInDays(
            trip.mealPrepDays,
            dayNumber,
            itemId,
            patch,
          ),
        })),
      );
    },
    [database, persist],
  );

  const toggleMealPrepItemStatus = useCallback(
    (dayNumber: number, itemId: string) => {
      if (!database?.activeTripId) return;
      const tripId = database.activeTripId;
      persist(
        updateTripById(database, tripId, (trip) => ({
          ...trip,
          mealPrepDays: toggleMealItemStatusInDays(
            trip.mealPrepDays,
            dayNumber,
            itemId,
          ),
        })),
      );
    },
    [database, persist],
  );

  const deleteMealPrepItem = useCallback(
    (dayNumber: number, itemId: string) => {
      if (!database?.activeTripId) return;
      const tripId = database.activeTripId;
      persist(
        updateTripById(database, tripId, (trip) => ({
          ...trip,
          mealPrepDays: deleteMealItemFromDays(
            trip.mealPrepDays,
            dayNumber,
            itemId,
          ),
        })),
      );
    },
    [database, persist],
  );

  const value = useMemo<CampReadyContextValue | null>(() => {
    if (!database) {
      return null;
    }

    return {
      ready,
      database,
      activeTrip,
      activeTripStats,
      activeTab,
      infoView,
      checklistFilter,
      collapsedCategories,
      editingTemplateId,
      editingTemplate,
      setActiveTab,
      setInfoView,
      openInfoMenu,
      closeInfo,
      setChecklistFilter,
      toggleCategory,
      selectTrip,
      createNewTrip,
      updateTrip,
      deleteTrip,
      setEditingTemplate,
      createBlankTemplate,
      createTemplateFromTrip,
      applyChecklistTemplateToTrip,
      createStarterTrip,
      createStarterChecklist,
      updateTemplate,
      deleteTemplate,
      addTemplateCategory,
      updateTemplateCategory,
      deleteTemplateCategory,
      addTemplateItem,
      updateTemplateItem,
      deleteTemplateItem,
      addCategory,
      updateCategory,
      deleteCategory,
      addItem,
      addChecklistItem,
      updateItem,
      deleteItem,
      cycleItemStatus,
      resetAllItems,
      importChecklistIntoTrip,
      storageRecovery,
      dismissStorageRecovery,
      resetAllData,
      restoreBackupCategories,
      updateVehiclePayloadSettings,
      addMealPrepItem,
      updateMealPrepItem,
      toggleMealPrepItemStatus,
      deleteMealPrepItem,
    };
  }, [
    ready,
    database,
    activeTrip,
    activeTripStats,
    activeTab,
    infoView,
    checklistFilter,
    collapsedCategories,
    editingTemplateId,
    editingTemplate,
    openInfoMenu,
    closeInfo,
    toggleCategory,
    selectTrip,
    createNewTrip,
    updateTrip,
    deleteTrip,
    setEditingTemplate,
    createBlankTemplate,
    createTemplateFromTrip,
    applyChecklistTemplateToTrip,
    createStarterTrip,
    createStarterChecklist,
    updateTemplate,
    deleteTemplate,
    addTemplateCategory,
    updateTemplateCategory,
    deleteTemplateCategory,
    addTemplateItem,
    updateTemplateItem,
    deleteTemplateItem,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    addChecklistItem,
    updateItem,
    deleteItem,
    cycleItemStatus,
    resetAllItems,
    importChecklistIntoTrip,
    storageRecovery,
    dismissStorageRecovery,
    resetAllData,
    restoreBackupCategories,
    updateVehiclePayloadSettings,
    addMealPrepItem,
    updateMealPrepItem,
    toggleMealPrepItemStatus,
    deleteMealPrepItem,
  ]);

  if (!value) {
    return (
      <div className="mobile-app-shell flex min-h-dvh items-center justify-center bg-background text-foreground">
        <p className="text-base font-medium text-muted">Loading CampSync…</p>
      </div>
    );
  }

  return (
    <CampReadyContext.Provider value={value}>
      {children}
    </CampReadyContext.Provider>
  );
}

export function useCampReady(): CampReadyContextValue {
  const context = useContext(CampReadyContext);
  if (!context) {
    throw new Error("useCampReady must be used within CampReadyProvider");
  }
  return context;
}
