"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { useUnits } from "@/components/providers/units-provider";
import {
  getPackedGearWeightLbs,
  getPayloadUsage,
  type PayloadStatusLevel,
} from "@/lib/vehicle-payload";
import { formatWeight } from "@/lib/units";
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import type { TripRecord } from "@/types";
import { Lock } from "lucide-react";
import Link from "next/link";

const STATUS_STROKE: Record<PayloadStatusLevel, string> = {
  safe: "var(--ring-progress)",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const STATUS_LABEL: Record<PayloadStatusLevel, string> = {
  safe: "Within capacity",
  warning: "Approaching capacity",
  critical: "Over capacity risk",
};

function PayloadRing({
  ringPercent,
  status,
  centerLabel,
  centerSubLabel,
  ariaLabel,
  size = 88,
  strokeWidth = 8,
}: {
  ringPercent: number;
  status: PayloadStatusLevel;
  centerLabel: string;
  centerSubLabel: string;
  ariaLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, ringPercent / 100));
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
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
          stroke={STATUS_STROKE[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1.5 text-center">
        <span className="text-sm font-bold leading-none tabular-nums text-foreground">
          {centerLabel}
        </span>
        <span className="mt-1 text-[0.55rem] font-bold uppercase leading-none tracking-wide text-muted">
          {centerSubLabel}
        </span>
      </div>
    </div>
  );
}

function LockedPayloadTeaser() {
  const { openPaywall } = usePro();

  return (
    <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Payload Summary</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">
            Monitor packed gear against vehicle capacity with Pro.
          </p>
        </div>
        <button
          type="button"
          onClick={openPaywall}
          className="touch-target shrink-0 rounded-lg bg-gradient-to-r from-amber-500/90 to-teal-500/90 px-2.5 py-2 text-[0.7rem] font-bold text-zinc-950 active:opacity-90"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}

function ActivePayloadSummary({ trip }: { trip: TripRecord }) {
  const { database } = useCampReady();
  const { units } = useUnits();
  const capacity = database.vehiclePayload?.maxPayloadCapacityLbs;
  const packedLbs = getPackedGearWeightLbs(trip);
  const usage = typeof capacity === "number" ? getPayloadUsage(packedLbs, capacity) : null;

  if (!usage) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3">
        <p className="text-sm font-bold text-foreground">Payload Summary</p>
        <p className="mt-1 text-xs leading-snug text-muted">
          Set a max payload capacity in Settings to start monitoring.
        </p>
        <Link
          href="/settings/"
          className="touch-target mt-3 inline-flex items-center justify-center rounded-lg border-2 border-border bg-surface px-3 py-2 text-xs font-bold text-foreground active:opacity-90"
        >
          Open Settings
        </Link>
      </div>
    );
  }

  const percentLabel = `${Math.round(usage.percentUsed)}%`;
  const remainingLabel =
    usage.remainingLbs >= 0
      ? `${formatWeight(usage.remainingLbs, units)} remaining`
      : `${formatWeight(Math.abs(usage.remainingLbs), units)} over`;

  return (
    <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3">
      <div className="flex items-center gap-3">
        <PayloadRing
          ringPercent={usage.ringPercent}
          status={usage.status}
          centerLabel={percentLabel}
          centerSubLabel="used"
          ariaLabel={`Payload ${percentLabel} used. ${STATUS_LABEL[usage.status]}. Packed ${formatWeight(usage.packedWeightLbs, units)} of ${formatWeight(usage.capacityLbs, units)}.`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Payload Summary</p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-foreground">
            {formatWeight(usage.packedWeightLbs, units)}
            <span className="font-medium text-muted">
              {" "}
              / {formatWeight(usage.capacityLbs, units)}
            </span>
          </p>
          <p
            className={`mt-1 text-xs font-bold ${
              usage.status === "critical"
                ? "text-red-600 dark:text-red-400"
                : usage.status === "warning"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-accent"
            }`}
          >
            {STATUS_LABEL[usage.status]}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted">{remainingLabel}</p>
        </div>
      </div>
    </div>
  );
}

interface PayloadSummaryProps {
  trip: TripRecord;
}

export function PayloadSummary({ trip }: PayloadSummaryProps) {
  const { database } = useCampReady();
  const { isPro } = usePro();
  const alarmEnabled = database.vehiclePayload?.alarmEnabled === true;
  const showLockedTeaser = !isPro && !isPrimeTestLabBypassActive();

  if (showLockedTeaser) {
    return <LockedPayloadTeaser />;
  }

  if (!isPro || !alarmEnabled) {
    return null;
  }

  return <ActivePayloadSummary trip={trip} />;
}
