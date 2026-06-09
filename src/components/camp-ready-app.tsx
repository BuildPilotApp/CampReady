"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { InfoPanel } from "@/components/info/info-panel";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { CampReadyProvider, useCampReady } from "@/components/providers/camp-ready-provider";
import { ChecklistView } from "@/components/views/checklist-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { Fab } from "@/components/ui/fab";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { Tent, RotateCcw, Info } from "lucide-react";

function AppHeader() {
  const {
    activeTab,
    activeTrip,
    activeTripStats,
    openInfoMenu,
  } = useCampReady();

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
  const { activeTab, activeTrip, resetAllItems } = useCampReady();
  const { armed, handleClick, ref } = useDestructiveConfirm(resetAllItems);

  return (
    <div className="relative">
      {activeTab === "checklist" && activeTrip ? (
        <Fab
          ref={ref}
          armed={armed}
          label="Reset or uncheck all items"
          text={armed ? "Confirm?" : "Reset All"}
          onClick={handleClick}
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
      {activeTab === "dashboard" ? <DashboardView /> : <ChecklistView />}
      {infoView ? <InfoPanel /> : null}
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
