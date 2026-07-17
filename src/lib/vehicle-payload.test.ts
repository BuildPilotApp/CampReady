import { describe, expect, it } from "vitest";
import {
  getPackedGearWeightLbs,
  getPayloadStatus,
  getPayloadUsage,
} from "@/lib/vehicle-payload";
import type { TripRecord } from "@/types";

function makeTrip(items: TripRecord["categories"][number]["items"]): TripRecord {
  return {
    id: "trip-1",
    name: "Test",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    categories: [
      {
        id: "cat-1",
        name: "Gear",
        items,
      },
    ],
  };
}

describe("getPackedGearWeightLbs", () => {
  it("sums only packed items with valid positive weights", () => {
    const trip = makeTrip([
      {
        id: "1",
        category: "cat-1",
        name: "Tent",
        status: "packed",
        weight_lbs: 10,
      },
      {
        id: "2",
        category: "cat-1",
        name: "Stove",
        status: "staged",
        weight_lbs: 5,
      },
      {
        id: "3",
        category: "cat-1",
        name: "Chair",
        status: "missing",
        weight_lbs: 8,
      },
      {
        id: "4",
        category: "cat-1",
        name: "Bag",
        status: "packed",
      },
      {
        id: "5",
        category: "cat-1",
        name: "Zero",
        status: "packed",
        weight_lbs: 0,
      },
      {
        id: "6",
        category: "cat-1",
        name: "Cooler",
        status: "packed",
        weight_lbs: 20.5,
      },
    ]);

    expect(getPackedGearWeightLbs(trip)).toBe(30.5);
  });

  it("returns 0 when nothing is packed", () => {
    const trip = makeTrip([
      {
        id: "1",
        category: "cat-1",
        name: "Tent",
        status: "missing",
        weight_lbs: 12,
      },
    ]);

    expect(getPackedGearWeightLbs(trip)).toBe(0);
  });
});

describe("getPayloadStatus", () => {
  it("is safe below 85%", () => {
    expect(getPayloadStatus(84.9, 100)).toBe("safe");
    expect(getPayloadStatus(0, 100)).toBe("safe");
  });

  it("is warning from 85% through 95% inclusive", () => {
    expect(getPayloadStatus(85, 100)).toBe("warning");
    expect(getPayloadStatus(90, 100)).toBe("warning");
    expect(getPayloadStatus(95, 100)).toBe("warning");
  });

  it("is critical above 95%", () => {
    expect(getPayloadStatus(95.1, 100)).toBe("critical");
    expect(getPayloadStatus(150, 100)).toBe("critical");
  });
});

describe("getPayloadUsage", () => {
  it("returns null without a positive capacity", () => {
    expect(getPayloadUsage(10, 0)).toBeNull();
    expect(getPayloadUsage(10, -5)).toBeNull();
  });

  it("clamps ring percent but keeps true percent when over capacity", () => {
    const usage = getPayloadUsage(120, 100);
    expect(usage).not.toBeNull();
    expect(usage?.percentUsed).toBe(120);
    expect(usage?.ringPercent).toBe(100);
    expect(usage?.remainingLbs).toBe(-20);
    expect(usage?.status).toBe("critical");
  });
});
