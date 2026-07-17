"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import type { AppTab } from "@/types";
import { ClipboardList, LayoutDashboard, UtensilsCrossed } from "lucide-react";

const BASE_TABS: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "checklist", label: "Gear Checklist", icon: ClipboardList },
  ];

const MEAL_TAB: { id: AppTab; label: string; icon: typeof LayoutDashboard } = {
  id: "meal-prep",
  label: "Meal Prep",
  icon: UtensilsCrossed,
};

export function BottomNav() {
  const { activeTab, setActiveTab, closeInfo, database } = useCampReady();
  const { isPro } = usePro();
  const mealPrepEnabled = database.mealPrep?.enabled === true;
  const showMealTab =
    mealPrepEnabled && (isPro || isPrimeTestLabBypassActive());

  const tabs = showMealTab ? [...BASE_TABS, MEAL_TAB] : BASE_TABS;

  return (
    <nav
      className="flex border-t border-border bg-surface"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              closeInfo();
              setActiveTab(tab.id);
            }}
            aria-current={selected ? "page" : undefined}
            className={`touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold active:bg-background ${
              selected ? "text-accent" : "text-muted"
            }`}
          >
            <Icon
              className="size-6 shrink-0"
              strokeWidth={selected ? 2.5 : 2}
              aria-hidden
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
