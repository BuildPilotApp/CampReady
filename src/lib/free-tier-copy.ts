import { FREE_TEMPLATE_LIMIT, FREE_TRIP_LIMIT } from "@/lib/pro";

export function formatFreeTripUsage(tripCount: number): string {
  return `${tripCount} of ${FREE_TRIP_LIMIT} trip${FREE_TRIP_LIMIT === 1 ? "" : "s"}`;
}

export function formatFreeTemplateUsage(templateCount: number): string {
  return `${templateCount} of ${FREE_TEMPLATE_LIMIT} saved checklist${FREE_TEMPLATE_LIMIT === 1 ? "" : "s"}`;
}

export function formatFreePlanSummary(tripCount: number, templateCount: number): string {
  return `Free plan · ${formatFreeTripUsage(tripCount)} · ${formatFreeTemplateUsage(templateCount)}`;
}
