"use client";

import { CHECKLIST_TEMPLATES } from "@/lib/templates";
import { nextGearStatus } from "@/lib/gear-status";
import {
  cloneCategories,
  hydrateDatabase,
  syncTripCounts,
  writeDatabaseSync,
} from "@/lib/storage";
import type {
  AppTab,
  CampReadyDatabase,
  ChecklistFilter,
  GearItemStatus,
  Trip,
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
  activeTrip: Trip | null;
  activeTab: AppTab;
  checklistFilter: ChecklistFilter;
  collapsedCategories: Record<string, boolean>;
  setActiveTab: (tab: AppTab) => void;
  setChecklistFilter: (filter: ChecklistFilter) => void;
  toggleCategory: (categoryId: string) => void;
  cycleItemStatus: (itemId: string) => void;
  applyTemplate: (templateId: string) => void;
  resetAllItems: () => void;
}

const CampReadyContext = createContext<CampReadyContextValue | null>(null);

function updateActiveTrip(
  database: CampReadyDatabase,
): CampReadyDatabase {
  if (!database.activeTripId) {
    return database;
  }

  const tripIndex = database.trips.findIndex(
    (trip) => trip.id === database.activeTripId,
  );
  if (tripIndex === -1) {
    return database;
  }

  const synced = syncTripCounts(database.trips[tripIndex]!, database.categories);
  const trips = [...database.trips];
  trips[tripIndex] = synced;

  return { ...database, trips };
}

export function CampReadyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [database, setDatabase] = useState<CampReadyDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [checklistFilter, setChecklistFilter] =
    useState<ChecklistFilter>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

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
    const withCounts = updateActiveTrip(next);
    setDatabase(withCounts);
    writeDatabaseSync(withCounts);
  }, []);

  const activeTrip = useMemo(() => {
    if (!database?.activeTripId) {
      return null;
    }
    return (
      database.trips.find((trip) => trip.id === database.activeTripId) ?? null
    );
  }, [database]);

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }, []);

  const cycleItemStatus = useCallback(
    (itemId: string) => {
      if (!database) {
        return;
      }

      const categories = database.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          if (item.id !== itemId) {
            return item;
          }
          return { ...item, status: nextGearStatus(item.status) };
        }),
      }));

      persist({ ...database, categories });
    },
    [database, persist],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      if (!database) {
        return;
      }

      const template = CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId);
      if (!template) {
        return;
      }

      const categories = cloneCategories(template.categories);
      persist({ ...database, categories });
      setActiveTab("checklist");
      setChecklistFilter("all");
      setCollapsedCategories({});
    },
    [database, persist],
  );

  const resetAllItems = useCallback(() => {
    if (!database) {
      return;
    }

    const confirmed = window.confirm(
      "Reset all items to Missing? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    const categories = database.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        status: "missing" as GearItemStatus,
      })),
    }));

    persist({ ...database, categories });
  }, [database, persist]);

  const value = useMemo<CampReadyContextValue | null>(() => {
    if (!database) {
      return null;
    }

    return {
      ready,
      database,
      activeTrip,
      activeTab,
      checklistFilter,
      collapsedCategories,
      setActiveTab,
      setChecklistFilter,
      toggleCategory,
      cycleItemStatus,
      applyTemplate,
      resetAllItems,
    };
  }, [
    ready,
    database,
    activeTrip,
    activeTab,
    checklistFilter,
    collapsedCategories,
    toggleCategory,
    cycleItemStatus,
    applyTemplate,
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
