import { enumerateDateRange, formatShortDate } from "@/lib/date-utils";
import { createMealPrepItem } from "@/lib/storage/defaults";
import type {
  MealItemStatus,
  MealPrepDay,
  MealPrepItem,
  TripRecord,
} from "@/types";

export interface VisibleMealPrepDay {
  dayNumber: number;
  dateIso: string;
  dateLabel: string;
  items: MealPrepItem[];
  consumedCount: number;
  totalCount: number;
}

/** Build inclusive Day 1…N list for the trip date range, merging stored items. */
export function getVisibleMealPrepDays(trip: TripRecord): VisibleMealPrepDay[] {
  const dates = enumerateDateRange(trip.startDate, trip.endDate);
  const storedByDay = new Map<number, MealPrepItem[]>();

  for (const day of trip.mealPrepDays ?? []) {
    if (!Number.isInteger(day.dayNumber) || day.dayNumber < 1) continue;
    storedByDay.set(day.dayNumber, day.items ?? []);
  }

  return dates.map((dateIso, index) => {
    const dayNumber = index + 1;
    const items = storedByDay.get(dayNumber) ?? [];
    const consumedCount = items.filter((item) => item.status === "consumed").length;

    return {
      dayNumber,
      dateIso,
      dateLabel: formatShortDate(dateIso),
      items,
      consumedCount,
      totalCount: items.length,
    };
  });
}

/** Upsert a day's items while preserving other stored days (including hidden ones). */
export function upsertMealPrepDayItems(
  mealPrepDays: MealPrepDay[] | undefined,
  dayNumber: number,
  items: MealPrepItem[],
): MealPrepDay[] {
  const next = [...(mealPrepDays ?? [])];
  const index = next.findIndex((day) => day.dayNumber === dayNumber);

  if (items.length === 0) {
    if (index >= 0) {
      next.splice(index, 1);
    }
    return next.sort((a, b) => a.dayNumber - b.dayNumber);
  }

  const day: MealPrepDay = { dayNumber, items };
  if (index >= 0) {
    next[index] = day;
  } else {
    next.push(day);
  }

  return next.sort((a, b) => a.dayNumber - b.dayNumber);
}

export function addMealItemToDays(
  mealPrepDays: MealPrepDay[] | undefined,
  dayNumber: number,
  title: string,
  recipeNotes?: string,
): MealPrepDay[] {
  const trimmed = title.trim();
  if (!trimmed || dayNumber < 1) {
    return mealPrepDays ?? [];
  }

  const existing = mealPrepDays?.find((day) => day.dayNumber === dayNumber)?.items ?? [];
  const item = createMealPrepItem({
    title: trimmed,
    recipeNotes,
    status: "available",
  });

  return upsertMealPrepDayItems(mealPrepDays, dayNumber, [...existing, item]);
}

export function updateMealItemInDays(
  mealPrepDays: MealPrepDay[] | undefined,
  dayNumber: number,
  itemId: string,
  patch: Partial<Pick<MealPrepItem, "title" | "status" | "recipeNotes">>,
): MealPrepDay[] {
  const existing = mealPrepDays?.find((day) => day.dayNumber === dayNumber)?.items ?? [];
  if (existing.length === 0) {
    return mealPrepDays ?? [];
  }

  const items = existing.map((item) => {
    if (item.id !== itemId) return item;

    const next: MealPrepItem = { ...item };

    if (typeof patch.title === "string") {
      const trimmed = patch.title.trim();
      if (trimmed) next.title = trimmed;
    }

    if (patch.status === "available" || patch.status === "consumed") {
      next.status = patch.status;
    }

    if ("recipeNotes" in patch) {
      const notes =
        typeof patch.recipeNotes === "string" ? patch.recipeNotes.trim() : "";
      if (notes) {
        next.recipeNotes = notes;
      } else {
        delete next.recipeNotes;
      }
    }

    return next;
  });

  return upsertMealPrepDayItems(mealPrepDays, dayNumber, items);
}

export function toggleMealItemStatusInDays(
  mealPrepDays: MealPrepDay[] | undefined,
  dayNumber: number,
  itemId: string,
): MealPrepDay[] {
  const existing = mealPrepDays?.find((day) => day.dayNumber === dayNumber)?.items ?? [];
  const current = existing.find((item) => item.id === itemId);
  if (!current) {
    return mealPrepDays ?? [];
  }

  const nextStatus: MealItemStatus =
    current.status === "consumed" ? "available" : "consumed";

  return updateMealItemInDays(mealPrepDays, dayNumber, itemId, {
    status: nextStatus,
  });
}

export function deleteMealItemFromDays(
  mealPrepDays: MealPrepDay[] | undefined,
  dayNumber: number,
  itemId: string,
): MealPrepDay[] {
  const existing = mealPrepDays?.find((day) => day.dayNumber === dayNumber)?.items ?? [];
  if (existing.length === 0) {
    return mealPrepDays ?? [];
  }

  return upsertMealPrepDayItems(
    mealPrepDays,
    dayNumber,
    existing.filter((item) => item.id !== itemId),
  );
}

export type MealDayProgress = "empty" | "partial" | "complete";

export interface MealPrepNextItem {
  dayNumber: number;
  title: string;
  dateLabel: string;
}

export interface MealPrepSummary {
  totalCount: number;
  consumedCount: number;
  remainingCount: number;
  nextItem: MealPrepNextItem | null;
}

export function getMealPrepSummary(days: VisibleMealPrepDay[]): MealPrepSummary {
  let totalCount = 0;
  let consumedCount = 0;
  let nextItem: MealPrepNextItem | null = null;

  for (const day of days) {
    totalCount += day.totalCount;
    consumedCount += day.consumedCount;

    if (!nextItem) {
      const remaining = day.items.find((item) => item.status !== "consumed");
      if (remaining) {
        nextItem = {
          dayNumber: day.dayNumber,
          title: remaining.title,
          dateLabel: day.dateLabel,
        };
      }
    }
  }

  return {
    totalCount,
    consumedCount,
    remainingCount: totalCount - consumedCount,
    nextItem,
  };
}

/**
 * Day to emphasize: today if in range, else first day with remaining items,
 * else Day 1 when any days exist.
 */
export function resolveFocusDayNumber(
  days: VisibleMealPrepDay[],
  todayIso: string,
): number | null {
  if (days.length === 0) {
    return null;
  }

  const todayDay = days.find((day) => day.dateIso === todayIso);
  if (todayDay) {
    return todayDay.dayNumber;
  }

  const withRemaining = days.find(
    (day) => day.totalCount - day.consumedCount > 0,
  );
  if (withRemaining) {
    return withRemaining.dayNumber;
  }

  return days[0]?.dayNumber ?? null;
}

export function getMealDayProgress(
  day: Pick<VisibleMealPrepDay, "totalCount" | "consumedCount">,
): MealDayProgress {
  if (day.totalCount === 0) {
    return "empty";
  }
  if (day.consumedCount >= day.totalCount) {
    return "complete";
  }
  return "partial";
}

export function getMealDayProgressStyles(progress: MealDayProgress): {
  header: string;
  border: string;
  subtitle: string;
} {
  switch (progress) {
    case "complete":
      return {
        header: "bg-background/80",
        border: "border-border/80",
        subtitle: "text-muted",
      };
    case "partial":
      return {
        header: "bg-accent/8",
        border: "border-accent/35",
        subtitle: "text-accent",
      };
    case "empty":
    default:
      return {
        header: "bg-accent/8",
        border: "border-border",
        subtitle: "text-muted",
      };
  }
}

/** One-line preview of recipe notes for collapsed rows. */
export function truncateRecipePreview(
  notes: string,
  maxLength = 80,
): string {
  const normalized = notes.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Split recipe notes into text and http(s) URL segments for display. */
export function splitRecipeNoteSegments(
  notes: string,
): Array<{ type: "text" | "url"; value: string }> {
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  const segments: Array<{ type: "text" | "url"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(notes)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: notes.slice(lastIndex, match.index),
      });
    }

    let url = match[0];
    // Trim common trailing punctuation from pasted URLs.
    url = url.replace(/[),.;!?]+$/g, "");
    segments.push({ type: "url", value: url });
    lastIndex = match.index + match[0].length;
    if (url.length < match[0].length) {
      const trailing = match[0].slice(url.length);
      if (trailing) {
        segments.push({ type: "text", value: trailing });
      }
    }
  }

  if (lastIndex < notes.length) {
    segments.push({ type: "text", value: notes.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: notes }];
}
