"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { InfoPanel } from "@/components/info/info-panel";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { CampReadyProvider, useCampReady } from "@/components/providers/camp-ready-provider";
import { ChecklistView } from "@/components/views/checklist-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { Fab } from "@/components/ui/fab";
import { Tent, RotateCcw, Info, ChevronLeft } from "lucide-react";

function AppHeader() {
  const {
    activeTab,
    activeTrip,
    activeTripStats,
    infoView,
    openInfoMenu,
    closeInfo,
  } = useCampReady();

  if (infoView) {
    return (
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={closeInfo}
          aria-label="Back to dashboard"
          className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-border bg-surface text-foreground active:opacity-90"
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight text-foreground">
            Information
          </p>
          <p className="truncate text-sm font-medium text-muted">CampReady</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Tent className="size-8 shrink-0 text-accent" strokeWidth={2.25} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight text-foreground">CampReady</p>
        <p className="truncate text-sm font-medium text-muted">
          {activeTab === "dashboard"
            ? "Trip dashboard"
            : activeTrip
              ? `${activeTrip.name} · Gear checklist`
              : "Gear checklist"}
        </p>
        {activeTab === "checklist" && activeTripStats ? (
          <p className="mt-1 text-xs font-bold text-foreground">
            {activeTripStats.percentPacked}% Packed{" "}
            <span className="font-semibold text-muted">|</span> Total Weight:{" "}
            <span className="tabular-nums">
              {activeTripStats.totalWeightLbs.toFixed(1)}
            </span>{" "}
            lbs
          </p>
        ) : null}
      </div>
      {activeTab === "dashboard" ? (
        <button
          type="button"
          onClick={openInfoMenu}
          aria-label="Open information menu"
          className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-accent active:opacity-90"
        >
          <Info className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function CampReadyFooter() {
  const { activeTab, infoView, resetAllItems } = useCampReady();

  if (infoView) {
    return null;
  }

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
  const { activeTab, infoView } = useCampReady();

  return (
    <MobileShell header={<AppHeader />} footer={<CampReadyFooter />}>
      {infoView ? (
        <InfoPanel />
      ) : activeTab === "dashboard" ? (
        <DashboardView />
      ) : (
        <ChecklistView />
      )}
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
