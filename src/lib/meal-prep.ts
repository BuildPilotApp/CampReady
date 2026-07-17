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
