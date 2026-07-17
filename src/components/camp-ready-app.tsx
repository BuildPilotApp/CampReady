"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { InfoPanel } from "@/components/info/info-panel";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { FirstLaunchOnboarding } from "@/components/onboarding/first-launch-onboarding";
import { AppRuntimeProvider } from "@/components/providers/app-runtime-provider";
import { CampReadyProvider, useCampReady } from "@/components/providers/camp-ready-provider";
import { ProProvider, usePro } from "@/components/providers/pro-provider";
import { useUnits } from "@/components/providers/units-provider";
import { ChecklistView } from "@/components/views/checklist-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { MealPrepView } from "@/components/views/meal-prep-view";
import { AppToastProvider, useAppToast } from "@/components/ui/app-toast-provider";
import { GlobalNotificationProvider } from "@/components/providers/global-notification-provider";
import { ImportValidationBanner } from "@/components/ui/import-validation-banner";
import { StorageLimitBanner } from "@/components/ui/storage-limit-banner";
import { StorageRecoveryBanner } from "@/components/ui/storage-recovery-banner";
import { Fab } from "@/components/ui/fab";
import { PlanStatusChip } from "@/components/premium/plan-status-chip";
import { useDestructiveConfirm } from "@/hooks/use-destructive-confirm";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import { formatWeight } from "@/lib/units";
import type { AppTab } from "@/types";
import { ClipboardList, Info, RotateCcw, Settings, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";

const APP_ICON_SRC = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icons/app-icon.png`;

function useMealPrepNavEnabled(): boolean {
  const { database } = useCampReady();
  const { isPro } = usePro();
  return (
    database.mealPrep?.enabled === true &&
    (isPro || isPrimeTestLabBypassActive())
  );
}

function AppHeaderBrandIcon() {
  return (
    <img
      src={APP_ICON_SRC}
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-[22%] shadow-sm"
      aria-hidden
      draggable={false}
    />
  );
}

function AppHeader() {
  const {
    activeTab,
    activeTrip,
    activeTripStats,
    openInfoMenu,
  } = useCampReady();
  const { isPro } = usePro();
  const { units } = useUnits();
  const showPlanChip = !isPro && !isPrimeTestLabBypassActive();
  const totalWeightLabel = activeTripStats
    ? formatWeight(activeTripStats.totalWeightLbs, units)
    : null;

  return (
    <>
      <div className="flex items-center gap-3 py-3 lg:hidden">
        <AppHeaderBrandIcon />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold leading-tight text-foreground">CampSync</p>
            {showPlanChip ? <PlanStatusChip /> : null}
          </div>
          <p className="truncate text-sm font-medium text-muted">
            {activeTab === "dashboard"
              ? "Trip dashboard"
              : activeTab === "meal-prep"
                ? activeTrip
                  ? `${activeTrip.name} · Meal prep`
                  : "Meal prep"
                : activeTrip
                  ? `${activeTrip.name} · Gear checklist`
                  : "Gear checklist"}
          </p>
          {activeTab === "checklist" && activeTripStats && totalWeightLabel ? (
            <p className="mt-1 text-xs font-bold text-foreground">
              {activeTripStats.percentPacked}% Packed{" "}
              <span className="font-semibold text-muted">|</span> Total Weight:{" "}
              <span className="tabular-nums">{totalWeightLabel}</span>
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
        <AppHeaderBrandIcon />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold leading-tight text-foreground">CampSync</p>
            {showPlanChip ? <PlanStatusChip /> : null}
          </div>
          <p className="truncate text-sm font-medium text-muted">
            {activeTrip
              ? `${activeTrip.name} · Dashboard & trip tools`
              : "Dashboard & trip tools"}
          </p>
          {activeTripStats && totalWeightLabel ? (
            <p className="mt-1 text-xs font-bold text-foreground">
              {activeTripStats.percentPacked}% Packed{" "}
              <span className="font-semibold text-muted">|</span> Total Weight:{" "}
              <span className="tabular-nums">{totalWeightLabel}</span>
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
      {activeTrip && activeTab === "checklist" ? (
        <Fab
          {...fabProps}
          className="lg:flex fab-tablet-split"
        />
      ) : null}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopSecondaryPane() {
  const { activeTab, setActiveTab } = useCampReady();
  const mealPrepNavEnabled = useMealPrepNavEnabled();
  const secondaryTab: AppTab =
    mealPrepNavEnabled && activeTab === "meal-prep" ? "meal-prep" : "checklist";

  return (
    <section
      aria-label={secondaryTab === "meal-prep" ? "Meal prep" : "Gear checklist"}
      className="app-split-pane app-split-divider"
    >
      {mealPrepNavEnabled ? (
        <div
          className="mb-3 flex rounded-xl border border-border bg-surface p-1"
          role="tablist"
          aria-label="Trip tools"
        >
          <button
            type="button"
            role="tab"
            aria-selected={secondaryTab === "checklist"}
            onClick={() => setActiveTab("checklist")}
            className={`touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold active:opacity-90 ${
              secondaryTab === "checklist"
                ? "bg-accent text-accent-foreground"
                : "text-muted"
            }`}
          >
            <ClipboardList className="size-4 shrink-0" aria-hidden />
            Gear Checklist
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={secondaryTab === "meal-prep"}
            onClick={() => setActiveTab("meal-prep")}
            className={`touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold active:opacity-90 ${
              secondaryTab === "meal-prep"
                ? "bg-accent text-accent-foreground"
                : "text-muted"
            }`}
          >
            <UtensilsCrossed className="size-4 shrink-0" aria-hidden />
            Meal Prep
          </button>
        </div>
      ) : null}
      {secondaryTab === "meal-prep" ? <MealPrepView /> : <ChecklistView />}
    </section>
  );
}

function CampReadyShell() {
  const { activeTab, infoView, setActiveTab } = useCampReady();
  const mealPrepNavEnabled = useMealPrepNavEnabled();

  useEffect(() => {
    if (activeTab === "meal-prep" && !mealPrepNavEnabled) {
      setActiveTab("checklist");
    }
  }, [activeTab, mealPrepNavEnabled, setActiveTab]);

  const mobileTab =
    activeTab === "meal-prep" && !mealPrepNavEnabled ? "checklist" : activeTab;

  return (
    <MobileShell header={<AppHeader />} footer={<CampReadyFooter />}>
      <StorageLimitBanner />
      <ImportValidationBanner />
      <StorageRecoveryBanner />

      <div className="lg:hidden">
        {mobileTab === "dashboard" ? (
          <DashboardView />
        ) : mobileTab === "meal-prep" ? (
          <MealPrepView />
        ) : (
          <ChecklistView />
        )}
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-0 lg:py-2">
        <section aria-label="Trip dashboard" className="app-split-pane pr-2">
          <DashboardView />
        </section>
        <DesktopSecondaryPane />
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
