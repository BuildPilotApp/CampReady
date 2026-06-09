"use client";

import {
  formatMonthYear,
  formatShortDate,
  getCalendarMonthDays,
  normalizeDateRange,
  parseIsoDate,
  todayIso,
  tripDurationDays,
} from "@/lib/date-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TripDateRangeInputProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayClasses(
  iso: string,
  rangeStart: string,
  rangeEnd: string,
  awaitingEnd: boolean,
): string {
  const inRange = iso >= rangeStart && iso <= rangeEnd;
  const isStart = iso === rangeStart;
  const isEnd = iso === rangeEnd;
  const isSingle = rangeStart === rangeEnd && isStart;

  if (isSingle) {
    return "rounded-full bg-accent text-accent-foreground shadow-sm";
  }

  if (isStart) {
    return [
      "rounded-l-full bg-accent text-accent-foreground shadow-sm",
      awaitingEnd ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-background" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (isEnd) {
    return "rounded-r-full bg-accent text-accent-foreground shadow-sm";
  }

  if (inRange) {
    return "rounded-none bg-accent/25 text-foreground";
  }

  return "rounded-full text-foreground active:bg-surface";
}

export function TripDateRangeInput({
  startDate,
  endDate,
  onChange,
  label = "Trip dates",
}: TripDateRangeInputProps) {
  const initial = parseIsoDate(startDate);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);

  useEffect(() => {
    if (awaitingEnd) {
      return;
    }

    setDraftStart(startDate);
    setPreviewEnd(null);
    const next = parseIsoDate(startDate);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }, [startDate, endDate, awaitingEnd]);

  const { startDate: rangeStart, endDate: rangeEnd } = awaitingEnd
    ? normalizeDateRange(draftStart, previewEnd ?? draftStart)
    : normalizeDateRange(startDate, endDate);

  const monthDays = useMemo(
    () => getCalendarMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const duration = tripDurationDays(rangeStart, rangeEnd);
  const today = todayIso();

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1, 12, 0, 0, 0);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function handleDayClick(iso: string) {
    if (awaitingEnd) {
      const next = normalizeDateRange(draftStart, iso);
      setAwaitingEnd(false);
      setPreviewEnd(null);
      onChange(next);
      return;
    }

    setDraftStart(iso);
    setPreviewEnd(iso);
    setAwaitingEnd(true);
  }

  function handleDayPreview(iso: string | null) {
    if (!awaitingEnd) {
      return;
    }
    setPreviewEnd(iso ?? draftStart);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
        <p
          key={`${rangeStart}-${rangeEnd}`}
          className="trip-range-duration text-xs font-bold text-accent"
        >
          {duration} day{duration === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-xl border-2 border-border bg-background p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex size-11 items-center justify-center rounded-xl border-2 border-border bg-surface text-foreground active:opacity-90"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p className="text-sm font-bold text-foreground">
            {formatMonthYear(viewYear, viewMonth)}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="touch-target inline-flex size-11 items-center justify-center rounded-xl border-2 border-border bg-surface text-foreground active:opacity-90"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <p className="mt-2 text-center text-xs font-semibold text-muted">
          {awaitingEnd
            ? "Tap your end date on the calendar"
            : "Tap a start date, then tap an end date"}
        </p>

        <p className="mt-1 text-center text-sm font-bold text-foreground transition-all duration-300">
          {rangeStart === rangeEnd
            ? formatShortDate(rangeStart)
            : `${formatShortDate(rangeStart)} – ${formatShortDate(rangeEnd)}`}
        </p>

        <div className="mt-3 grid grid-cols-7 gap-y-1">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[0.65rem] font-bold uppercase tracking-wide text-muted"
            >
              {day}
            </div>
          ))}

          {monthDays.map((iso, index) =>
            iso ? (
              <button
                key={iso}
                type="button"
                onClick={() => handleDayClick(iso)}
                onPointerEnter={() => handleDayPreview(iso)}
                onPointerLeave={() => handleDayPreview(null)}
                onPointerDown={() => handleDayPreview(iso)}
                aria-label={`Select ${formatShortDate(iso)}`}
                aria-pressed={iso >= rangeStart && iso <= rangeEnd}
                className={`touch-target relative flex h-11 w-full items-center justify-center text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ease-out ${getDayClasses(
                  iso,
                  rangeStart,
                  rangeEnd,
                  awaitingEnd,
                )} ${iso === today && !(iso >= rangeStart && iso <= rangeEnd) ? "ring-1 ring-accent/50" : ""}`}
              >
                {parseIsoDate(iso).getDate()}
              </button>
            ) : (
              <div key={`pad-${index}`} aria-hidden className="h-11" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
