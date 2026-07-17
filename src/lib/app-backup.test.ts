import { describe, expect, it } from "vitest";
import {
  CAMPREADY_BACKUP_FORMAT,
  CAMPREADY_BACKUP_VERSION,
  CAMPSYNC_BACKUP_FORMAT,
  formatCampReadyBackup,
  validateCampReadyBackup,
} from "@/lib/app-backup";
import type { CampReadyDatabase } from "@/types";

const database: CampReadyDatabase = {
  version: 1,
  activeTripId: "trip-1",
  trips: [
    {
      id: "trip-1",
      name: "Desert Weekend",
      startDate: "2026-07-10",
      endDate: "2026-07-12",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      categories: [
        {
          id: "cat-1",
          name: "Shelter",
          items: [
            {
              id: "item-1",
              category: "cat-1",
              name: "Tent",
              status: "packed",
            },
          ],
        },
      ],
    },
  ],
  templates: [
    {
      id: "template-1",
      name: "Car Camp",
      description: "Reusable gear",
      categories: [],
    },
  ],
};

describe("CampSync app backups", () => {
  it("formats full app data as a CampSync backup document", () => {
    const parsed = JSON.parse(formatCampReadyBackup(database)) as {
      version: number;
      format: string;
      app: string;
      database: CampReadyDatabase;
    };

    expect(parsed.version).toBe(CAMPREADY_BACKUP_VERSION);
    expect(parsed.format).toBe(CAMPSYNC_BACKUP_FORMAT);
    expect(parsed.app).toBe("CampSync");
    expect(parsed.database.trips).toHaveLength(1);
    expect(parsed.database.templates).toHaveLength(1);
    expect(parsed.database.activeTripId).toBe("trip-1");
  });

  it("preserves vehicle payload settings through format and restore", () => {
    const withPayload: CampReadyDatabase = {
      ...database,
      vehiclePayload: {
        alarmEnabled: true,
        maxPayloadCapacityLbs: 1200,
      },
    };

    const result = validateCampReadyBackup(formatCampReadyBackup(withPayload));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.vehiclePayload?.alarmEnabled).toBe(true);
      expect(result.database.vehiclePayload?.maxPayloadCapacityLbs).toBe(1200);
    }
  });

  it("defaults missing vehicle payload settings on legacy backups", () => {
    const legacy = {
      version: CAMPREADY_BACKUP_VERSION,
      format: CAMPREADY_BACKUP_FORMAT,
      exportedAt: "2026-01-01T00:00:00.000Z",
      app: "CampReady",
      database,
    };

    const result = validateCampReadyBackup(JSON.stringify(legacy));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.vehiclePayload?.alarmEnabled).toBe(false);
      expect(result.database.vehiclePayload?.maxPayloadCapacityLbs).toBeUndefined();
    }
  });

  it("preserves meal prep nav settings through format and restore", () => {
    const withMealNav: CampReadyDatabase = {
      ...database,
      mealPrep: { enabled: true },
    };

    const result = validateCampReadyBackup(formatCampReadyBackup(withMealNav));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.mealPrep?.enabled).toBe(true);
    }
  });

  it("defaults missing meal prep settings on legacy backups", () => {
    const legacy = {
      version: CAMPREADY_BACKUP_VERSION,
      format: CAMPREADY_BACKUP_FORMAT,
      exportedAt: "2026-01-01T00:00:00.000Z",
      app: "CampReady",
      database,
    };

    const result = validateCampReadyBackup(JSON.stringify(legacy));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.mealPrep?.enabled).toBe(false);
    }
  });

  it("preserves meal prep titles, notes, and consumed status through backup restore", () => {
    const withMeals: CampReadyDatabase = {
      ...database,
      trips: [
        {
          ...database.trips[0]!,
          mealPrepDays: [
            {
              dayNumber: 1,
              items: [
                {
                  id: "meal-1",
                  title: "Dutch oven chili",
                  status: "consumed",
                  recipeNotes: "Simmer 45 min. https://example.com/chili",
                },
                {
                  id: "meal-2",
                  title: "Trail mix",
                  status: "available",
                },
              ],
            },
            {
              dayNumber: 3,
              items: [
                {
                  id: "meal-3",
                  title: "Hidden day omelette",
                  status: "available",
                  recipeNotes: "Eggs and cheese",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = validateCampReadyBackup(formatCampReadyBackup(withMeals));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const days = result.database.trips[0]?.mealPrepDays ?? [];
      expect(days).toHaveLength(2);
      expect(days[0]?.items[0]?.title).toBe("Dutch oven chili");
      expect(days[0]?.items[0]?.status).toBe("consumed");
      expect(days[0]?.items[0]?.recipeNotes).toContain("https://example.com/chili");
      expect(days[0]?.items[1]?.status).toBe("available");
      expect(days[1]?.dayNumber).toBe(3);
      expect(days[1]?.items[0]?.title).toBe("Hidden day omelette");
    }
  });

  it("normalizes legacy trips without meal prep data safely", () => {
    const result = validateCampReadyBackup(formatCampReadyBackup(database));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const days = result.database.trips[0]?.mealPrepDays;
      expect(days === undefined || days.length === 0).toBe(true);
    }
  });

  it("validates and restores normalized full app data", () => {
    const result = validateCampReadyBackup(formatCampReadyBackup(database));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.trips[0]?.name).toBe("Desert Weekend");
      expect(result.database.templates[0]?.name).toBe("Car Camp");
    }
  });

  it("accepts legacy CampReady backup format", () => {
    const legacy = {
      version: CAMPREADY_BACKUP_VERSION,
      format: CAMPREADY_BACKUP_FORMAT,
      exportedAt: "2026-01-01T00:00:00.000Z",
      app: "CampReady",
      database,
    };

    const result = validateCampReadyBackup(JSON.stringify(legacy));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.database.trips[0]?.name).toBe("Desert Weekend");
    }
  });

  it("rejects non-backup JSON", () => {
    const result = validateCampReadyBackup(JSON.stringify({ hello: "world" }));

    expect(result.ok).toBe(false);
  });
});
