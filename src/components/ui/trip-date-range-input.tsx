"use client";

interface TripDateRangeInputProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
}

export function TripDateRangeInput({
  startDate,
  endDate,
  onChange,
  label = "Trip dates",
}: TripDateRangeInputProps) {
  function handleStartChange(nextStart: string) {
    onChange({
      startDate: nextStart,
      endDate: endDate < nextStart ? nextStart : endDate,
    });
  }

  function handleEndChange(nextEnd: string) {
    onChange({
      startDate: startDate > nextEnd ? nextEnd : startDate,
      endDate: nextEnd,
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-background px-3 py-1">
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleStartChange(e.target.value)}
          aria-label="Trip start date"
          className="touch-target min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-semibold text-foreground"
        />
        <span className="shrink-0 text-sm font-bold text-muted" aria-hidden>
          to
        </span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => handleEndChange(e.target.value)}
          aria-label="Trip end date"
          className="touch-target min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-semibold text-foreground"
        />
      </div>
    </div>
  );
}
