/** Format a local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function formatShortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1, 12, 0, 0, 0).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Sunday-based month grid with leading empty cells. */
export function getCalendarMonthDays(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0).getDate();
  const padding = first.getDay();
  const days: Array<string | null> = Array.from({ length: padding }, () => null);

  for (let day = 1; day <= lastDay; day++) {
    days.push(formatLocalIsoDate(new Date(year, month, day, 12, 0, 0, 0)));
  }

  return days;
}

export function normalizeDateRange(
  startIso: string,
  endIso: string,
): { startDate: string; endDate: string } {
  if (startIso <= endIso) {
    return { startDate: startIso, endDate: endIso };
  }
  return { startDate: endIso, endDate: startIso };
}

export function tripDurationDays(startIso: string, endIso: string): number {
  return enumerateDateRange(startIso, endIso).length;
}

export function enumerateDateRange(startIso: string, endIso: string): string[] {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (end < start) return [];

  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(formatLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function todayIso(): string {
  return formatLocalIsoDate(new Date());
}
