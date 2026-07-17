"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import type { AppTab } from "@/types";
import { ClipboardList, LayoutDashboard, Lock, Settings, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

const TABS: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "checklist", label: "Gear Checklist", icon: ClipboardList },
  { id: "meal-prep", label: "Meal Prep", icon: UtensilsCrossed },
];

export function BottomNav() {
  const { activeTab, setActiveTab, closeInfo } = useCampReady();
  const { isPro } = usePro();
  const showMealLock = !isPro && !isPrimeTestLabBypassActive();

  return (
    <nav
      className="flex border-t border-border bg-surface"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        const showLock = tab.id === "meal-prep" && showMealLock;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              closeInfo();
              setActiveTab(tab.id);
            }}
            aria-current={selected ? "page" : undefined}
            className={`touch-target relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold active:bg-background ${
              selected ? "text-accent" : "text-muted"
            }`}
          >
            <span className="relative inline-flex">
              <Icon
                className="size-6 shrink-0"
                strokeWidth={selected ? 2.5 : 2}
                aria-hidden
              />
              {showLock ? (
                <Lock
                  className="absolute -right-2 -top-1 size-3 text-muted"
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : null}
            </span>
            {tab.label}
          </button>
        );
      })}
      <Link
        href="/settings/"
        onClick={closeInfo}
        className="touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-muted active:bg-background"
      >
        <Settings className="size-6 shrink-0" strokeWidth={2} aria-hidden />
        Settings
      </Link>
    </nav>
  );
}
