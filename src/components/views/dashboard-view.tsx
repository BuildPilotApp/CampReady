"use client";

import { ActiveTripCard } from "@/components/dashboard/active-trip-card";
import { TripManager } from "@/components/dashboard/trip-manager";

export function DashboardView() {
  return (
    <div className="flex flex-col gap-5 py-4 pb-6">
      <ActiveTripCard />
      <TripManager />
    </div>
  );
}
