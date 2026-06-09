interface ProgressRingProps {
  packed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  packed,
  total,
  size = 120,
  strokeWidth = 10,
}: ProgressRingProps) {
  const compact = size < 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? packed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${packed} of ${total} packed`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-progress)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center ${
          compact ? "px-1.5" : "px-2"
        }`}
      >
        {compact ? (
          <>
            <span className="text-sm font-bold leading-none tabular-nums text-foreground">
              {packed}
              <span className="text-[0.6rem] font-semibold text-muted">/{total}</span>
            </span>
            <span className="mt-0.5 text-[0.5rem] font-bold uppercase leading-none tracking-wide text-accent">
              packed
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold leading-none tabular-nums text-foreground">
              {packed}
            </span>
            <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              of {total}
            </span>
            <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-wider text-accent">
              Packed
            </span>
          </>
        )}
      </div>
    </div>
  );
}
