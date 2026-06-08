"use client";

import { TripManager } from "@/components/dashboard/trip-manager";

export function DashboardView() {
  return (
    <div className="flex flex-col gap-5 py-4 pb-6">
      <TripManager />
    </div>
  );
}
