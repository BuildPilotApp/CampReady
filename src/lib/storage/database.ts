import type { CampReadyDatabase, TripRecord } from "@/types";
import { STORAGE_KEY } from "./constants";
import { createEmptyDatabase } from "./defaults";
import { ensureSeededDatabase } from "./seed";
import {
  clearLocalForage,
  readFromLocalForage,
  writeToLocalForage,
} from "./localforage-client";

let memoryCache: CampReadyDatabase | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseDatabase(raw: string): CampReadyDatabase | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === 1 &&
      "trips" in parsed &&
      Array.isArray(parsed.trips)
    ) {
      const record = parsed as Partial<CampReadyDatabase> & {
        activeTripId?: string | null;
        categories?: unknown;
      };

      // Migration path from earlier schema that stored a single global checklist.
      const legacyCategories = Array.isArray(record.categories)
        ? (record.categories as TripRecord["categories"])
        : null;

      const trips: TripRecord[] = (record.trips as TripRecord[]).map((trip, idx) => {
        const hasCategories =
          "categories" in trip && Array.isArray((trip as TripRecord).categories);

        const legacyDate =
          typeof (trip as any).date === "string" ? (trip as any).date : undefined;
        const startDate =
          typeof (trip as any).startDate === "string"
            ? (trip as any).startDate
            : legacyDate ?? defaultTripDate();
        const endDate =
          typeof (trip as any).endDate === "string"
            ? (trip as any).endDate
            : legacyDate ?? startDate;

        if (hasCategories) {
          const now = new Date().toISOString();
          return {
            ...(trip as any),
            location: (trip as any).location,
            startDate,
            endDate,
            createdAt: (trip as any).createdAt ?? now,
            updatedAt: (trip as any).updatedAt ?? now,
          } as TripRecord;
        }

        const now = new Date().toISOString();
        // Legacy schema used a single `date` field; migrate it to start/end.

        return {
          ...(trip as any),
          location: (trip as any).location,
          startDate,
          endDate,
          categories: idx === 0 && legacyCategories ? legacyCategories : [],
          createdAt: (trip as any).createdAt ?? now,
          updatedAt: (trip as any).updatedAt ?? now,
        } satisfies TripRecord;
      });

      return ensureSeededDatabase({
        version: 1,
        trips,
        templates: Array.isArray((record as any).templates) ? ((record as any).templates as any) : [],
        activeTripId: record.activeTripId ?? trips[0]?.id ?? null,
      });
    }
  } catch {
    return null;
  }
  return null;
}

function defaultTripDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function finalizeDatabase(data: CampReadyDatabase): CampReadyDatabase {
  const seeded = ensureSeededDatabase(data);
  memoryCache = seeded;
  return seeded;
}

function serializeDatabase(data: CampReadyDatabase): string {
  return JSON.stringify(data);
}

/**
 * Synchronous read from in-memory cache or localStorage.
 * Use on render paths and gesture handlers that need zero latency.
 */
export function readDatabaseSync(): CampReadyDatabase {
  if (memoryCache) {
    return memoryCache;
  }

  if (!isBrowser()) {
    return createEmptyDatabase();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryCache = createEmptyDatabase();
    return memoryCache;
  }

  const parsed = parseDatabase(raw) ?? createEmptyDatabase();
  return finalizeDatabase(parsed);
}

/**
 * Synchronous write to localStorage and in-memory cache.
 * Also mirrors to localforage asynchronously for durable offline storage.
 */
export function writeDatabaseSync(data: CampReadyDatabase): void {
  memoryCache = data;

  if (!isBrowser()) {
    return;
  }

  const serialized = serializeDatabase(data);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  void writeToLocalForage(serialized);
}

/** Hydrate memory + localStorage from localforage (e.g. first app launch). */
export async function hydrateDatabase(): Promise<CampReadyDatabase> {
  if (!isBrowser()) {
    return createEmptyDatabase();
  }

  const localRaw = window.localStorage.getItem(STORAGE_KEY);
  if (localRaw) {
    const localData = parseDatabase(localRaw);
    if (localData) {
      return finalizeDatabase(localData);
    }
  }

  const remoteRaw = await readFromLocalForage();
  if (remoteRaw) {
    const remoteData = parseDatabase(remoteRaw);
    if (remoteData) {
      const finalized = finalizeDatabase(remoteData);
      window.localStorage.setItem(STORAGE_KEY, serializeDatabase(finalized));
      return finalized;
    }
  }

  const seeded = finalizeDatabase(createEmptyDatabase());
  writeDatabaseSync(seeded);
  return seeded;
}

/** Async persist — same durability guarantees as sync write. */
export async function writeDatabase(data: CampReadyDatabase): Promise<void> {
  writeDatabaseSync(data);
}

export async function readDatabase(): Promise<CampReadyDatabase> {
  return readDatabaseSync();
}

export function clearDatabase(): void {
  const empty = createEmptyDatabase();
  memoryCache = empty;

  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  void clearLocalForage();
}

export function isStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const probe = "__campready_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
