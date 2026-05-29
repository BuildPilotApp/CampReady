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
