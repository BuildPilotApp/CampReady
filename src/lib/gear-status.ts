import type { GearItemStatus } from "@/types";

const STATUS_CYCLE: GearItemStatus[] = ["missing", "staged", "packed"];

export function nextGearStatus(current: GearItemStatus): GearItemStatus {
  const index = STATUS_CYCLE.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex]!;
}

export const STATUS_LABELS: Record<GearItemStatus, string> = {
  missing: "Missing",
  staged: "Staged",
  packed: "Packed in Vehicle",
};
