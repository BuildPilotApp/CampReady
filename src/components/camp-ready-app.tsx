"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { InfoPanel } from "@/components/info/info-panel";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { FirstLaunchOnboarding } from "@/components/onboarding/first-launch-onboarding";
import { AppRuntimeProvider } from "@/components/providers/app-runtime-provider";
import { CampReadyProvider, useCampReady } from "@/components/providers/camp-ready-provider";
import { ProProvider, usePro } from "@/components/providers/pro-provider";
import { ChecklistView } from "@/components/views/checklist-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { AppToastProvider, useAppToast } from "@/components/ui/app-toast-provider";
import { GlobalNotificationProvider } from "@/components/providers/global-notification-provider";
import { ImportValidationBanner } from "@/components/ui/import-validation-banner";
import { StorageLimitBanner } from "@/components/ui/storage-limit-banner";
import { StorageRecoveryBanner } from "@/components/ui/storage-recovery-banner";
import { Fab } from "@/components/ui/fab";
import { PlanStatusChip } from "@/components/premium/plan-status-chip";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import { Tent, RotateCcw, Info, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

function AppHeader() {
  const {
    activeTab,
    activeTrip,
    activeTripStats,
    openInfoMenu,
  } = useCampReady();
  const { isPro } = usePro();
  const showPlanChip = !isPro && !isPrimeTestLabBypassActive();

  return (
    <>
      <div className="flex items-center gap-3 py-3 lg:hidden">
        <Tent className="size-8 shrink-0 text-accent" strokeWidth={2.25} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold leading-tight text-foreground">CampReady</p>
            {showPlanChip ? <PlanStatusChip /> : null}
          </div>
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
        <Link
          href="/settings/"
          aria-label="Open settings"
          className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-muted active:opacity-90"
        >
          <Settings className="size-6" strokeWidth={2.25} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={openInfoMenu}
          aria-label="Open information menu"
          className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-accent active:opacity-90"
        >
          <Info className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="hidden items-center gap-3 py-3 lg:flex">
        <Tent className="size-8 shrink-0 text-accent" strokeWidth={2.25} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold leading-tight text-foreground">CampReady</p>
            {showPlanChip ? <PlanStatusChip /> : null}
          </div>
          <p className="truncate text-sm font-medium text-muted">
            {activeTrip
              ? `${activeTrip.name} · Dashboard & checklist`
              : "Dashboard & checklist"}
          </p>
          {activeTripStats ? (
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
        <Link
          href="/settings/"
          aria-label="Open settings"
          className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-muted active:opacity-90"
        >
          <Settings className="size-6" strokeWidth={2.25} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={openInfoMenu}
          aria-label="Open information menu"
          className="touch-target inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-accent active:opacity-90"
        >
          <Info className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </>
  );
}

function CampReadyFooter() {
  const { activeTab, activeTrip, resetAllItems } = useCampReady();
  const { showToast } = useAppToast();
  const handleReset = useCallback(() => {
    resetAllItems();
    showToast("All items set back to Needed.");
  }, [resetAllItems, showToast]);
  const { armed, handleClick, ref } = useDestructiveConfirm(handleReset);

  const fabProps = {
    ref,
    armed,
    label: "Reset or uncheck all items",
    text: armed ? "Confirm?" : "Reset All",
    onClick: handleClick,
    children: <RotateCcw className="size-6" strokeWidth={2.5} aria-hidden />,
  };

  return (
    <div className="relative">
      {activeTrip ? (
        <Fab
          {...fabProps}
          className={`${activeTab === "checklist" ? "" : "hidden"} lg:flex fab-tablet-split`}
        />
      ) : null}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

function CampReadyShell() {
  const { activeTab, infoView } = useCampReady();

  return (
    <MobileShell header={<AppHeader />} footer={<CampReadyFooter />}>
      <StorageLimitBanner />
      <ImportValidationBanner />
      <StorageRecoveryBanner />

      <div className="lg:hidden">
        {activeTab === "dashboard" ? <DashboardView /> : <ChecklistView />}
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-0 lg:py-2">
        <section aria-label="Trip dashboard" className="app-split-pane pr-2">
          <DashboardView />
        </section>
        <section
          aria-label="Gear checklist"
          className="app-split-pane app-split-divider"
        >
          <ChecklistView />
        </section>
      </div>

      {infoView ? <InfoPanel /> : null}
      <FirstLaunchOnboarding />
    </MobileShell>
  );
}

export function CampReadyApp() {
  return (
    <AppRuntimeProvider>
      <GlobalNotificationProvider>
        <AppToastProvider>
          <ProProvider>
            <CampReadyProvider>
              <CampReadyShell />
            </CampReadyProvider>
          </ProProvider>
        </AppToastProvider>
      </GlobalNotificationProvider>
    </AppRuntimeProvider>
  );
}
