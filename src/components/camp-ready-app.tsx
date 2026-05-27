"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { CampReadyProvider, useCampReady } from "@/components/providers/camp-ready-provider";
import { ChecklistView } from "@/components/views/checklist-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { Fab } from "@/components/ui/fab";
import { Tent, RotateCcw } from "lucide-react";

function AppHeader() {
  const { activeTab, activeTrip } = useCampReady();

  return (
    <div className="flex items-center gap-3 py-3">
      <Tent className="size-8 shrink-0 text-accent" strokeWidth={2.25} aria-hidden />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-foreground">CampReady</p>
        <p className="truncate text-sm font-medium text-muted">
          {activeTab === "dashboard"
            ? "Trip dashboard"
            : activeTrip
              ? `${activeTrip.name} checklist`
              : "Master checklist"}
        </p>
      </div>
    </div>
  );
}

function CampReadyFooter() {
  const { activeTab, resetAllItems } = useCampReady();

  return (
    <div className="relative">
      {activeTab === "checklist" ? (
        <Fab
          label="Reset or uncheck all items"
          text="Reset All"
          onClick={resetAllItems}
        >
          <RotateCcw className="size-6" strokeWidth={2.5} aria-hidden />
        </Fab>
      ) : null}
      <BottomNav />
    </div>
  );
}

function CampReadyShell() {
  const { activeTab } = useCampReady();

  return (
    <MobileShell header={<AppHeader />} footer={<CampReadyFooter />}>
      {activeTab === "dashboard" ? <DashboardView /> : <ChecklistView />}
    </MobileShell>
  );
}

export function CampReadyApp() {
  return (
    <CampReadyProvider>
      <CampReadyShell />
    </CampReadyProvider>
  );
}
