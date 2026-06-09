"use client";

import { nextGearStatus } from "@/lib/gear-status";
import {
  cloneCategories,
  hydrateDatabase,
  createCategory,
  createGearItem,
  createTrip,
  getTripStats,
  touchTrip,
  writeDatabaseSync,
} from "@/lib/storage";
import {
  CUSTOM_TEMPLATE_ID,
  getTemplateOptionLabel,
} from "@/lib/templates";
import type {
  AppTab,
  CampReadyDatabase,
  ChecklistFilter,
  ChecklistTemplate,
  GearItem,
  GearItemStatus,
  InfoView,
  TripRecord,
  TripLocation,
} from "@/types";
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
  createBlankTemplate: (name: string) => void;

  createTemplateFromTrip: (input: {
    tripId: string;
    name: string;
    description: string;
  }) => void;

  applyChecklistTemplateToTrip: (tripId: string, templateId: string) => void;

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
  updateItem: (itemId: string, patch: Partial<Omit<GearItem, "id" | "category">>) => void;
  deleteItem: (itemId: string) => void;
  cycleItemStatus: (itemId: string) => void;
  resetAllItems: () => void;
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

export function CampReadyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [database, setDatabase] = useState<CampReadyDatabase | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    void hydrateDatabase().then((data) => {
      if (!cancelled) {
        setDatabase(data);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: CampReadyDatabase) => {
    setDatabase(next);
    writeDatabaseSync(next);
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
      [categoryId]: !current[categoryId],
    }));
  }, []);

  const selectTrip = useCallback(
    (tripId: string) => {
      if (!database) return;
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
      if (!database) return;

      const template: ChecklistTemplate = {
        id: crypto.randomUUID(),
        name: name.trim() || "New Gear Checklist",
        description: "Reusable gear inventory for trips.",
        categories: [],
      };

      persist({ ...database, templates: [template, ...database.templates] });
      setEditingTemplateId(template.id);
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

      persist({ ...database, templates: [template, ...database.templates] });
      setEditingTemplateId(template.id);
    },
    [database, persist],
  );

  const applyChecklistTemplateToTrip = useCallback(
    (tripId: string, templateId: string) => {
      if (!database) return;
      const trip = database.trips.find((t) => t.id === tripId);
      if (!trip) return;

      const templateName = getTemplateOptionLabel(
        templateId,
        database.templates,
      );
      const message =
        templateId === CUSTOM_TEMPLATE_ID
          ? "Clear this trip's gear checklist? All categories and items will be removed."
          : `Load "${templateName}" onto this trip? Current items and pack status will be replaced.`;

      if (!window.confirm(message)) {
        return;
      }

      const template = resolveChecklistTemplate(database, templateId);
      const categories = template ? cloneCategories(template.categories) : [];

      persist(
        updateTripById(database, tripId, (currentTrip) => ({
          ...currentTrip,
          categories,
        })),
      );
      setCollapsedCategories({});
      setChecklistFilter("all");
    },
    [database, persist],
  );

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
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          categories: [category, ...template.categories],
        })),
      );
    },
    [database, persist],
  );

  const updateTemplateCategory = useCallback(
    (templateId: string, categoryId: string, name: string) => {
      if (!database) return;
      persist(
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          categories: template.categories.map((category) =>
            category.id === categoryId ? { ...category, name } : category,
          ),
        })),
      );
    },
    [database, persist],
  );

  const deleteTemplateCategory = useCallback(
    (templateId: string, categoryId: string) => {
      if (!database) return;
      persist(
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          categories: template.categories.filter(
            (category) => category.id !== categoryId,
          ),
        })),
      );
    },
    [database, persist],
  );

  const addTemplateItem = useCallback(
    (input: { templateId: string; categoryId: string; name: string }) => {
      if (!database) return;
      const item = createGearItem({
        name: input.name.trim() || "New Item",
        category: input.categoryId,
      });
      persist(
        updateTemplateById(database, input.templateId, (template) => ({
          ...template,
          categories: template.categories.map((category) =>
            category.id === input.categoryId
              ? { ...category, items: [item, ...category.items] }
              : category,
          ),
        })),
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
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          categories: template.categories.map((category) => ({
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          })),
        })),
      );
    },
    [database, persist],
  );

  const deleteTemplateItem = useCallback(
    (templateId: string, itemId: string) => {
      if (!database) return;
      persist(
        updateTemplateById(database, templateId, (template) => ({
          ...template,
          categories: template.categories.map((category) => ({
            ...category,
            items: category.items.filter((item) => item.id !== itemId),
          })),
        })),
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
          ...trip,
          categories: [category, ...trip.categories],
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
          ...trip,
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
          ...trip,
          categories: trip.categories.filter((c) => c.id !== categoryId),
        })),
      );
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
          ...trip,
          categories: trip.categories.map((c) =>
            c.id === input.categoryId ? { ...c, items: [item, ...c.items] } : c,
          ),
        })),
      );
    },
    [database, persist],
  );

  const updateItem = useCallback(
    (itemId: string, patch: Partial<Omit<GearItem, "id" | "category">>) => {
      if (!database?.activeTripId) return;
      persist(
        updateTripById(database, database.activeTripId, (trip) => ({
          ...trip,
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
          ...trip,
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

    const confirmed = window.confirm(
      "Reset all items to Missing? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

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
      updateItem,
      deleteItem,
      cycleItemStatus,
      resetAllItems,
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
    updateItem,
    deleteItem,
    cycleItemStatus,
    resetAllItems,
  ]);

  if (!value) {
    return (
      <div className="mobile-app-shell flex min-h-dvh items-center justify-center bg-background text-foreground">
        <p className="text-base font-medium text-muted">Loading CampReady…</p>
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
