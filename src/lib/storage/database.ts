import type { CampReadyDatabase, TripRecord } from "@/types";
import { STORAGE_KEY } from "./constants";
import { createEmptyDatabase } from "./defaults";
import {
  clearLocalForage,
  readFromLocalForage,
  writeToLocalForage,
} from "./localforage-client";
import { normalizeDatabaseDocument } from "./schema-normalize";
import { ensureSeededDatabase, isSampleTrip } from "./seed";
import {
  notifyStorageWriteFailure,
  notifyStorageWriteSuccess,
  type StorageWriteFailureReason,
} from "./storage-notifications";

export type HydrationRecoveryReason = "corrupt" | "error";

export interface HydrationResult {
  database: CampReadyDatabase;
  recovered: boolean;
  reason?: HydrationRecoveryReason;
}

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: StorageWriteFailureReason };

let memoryCache: CampReadyDatabase | null = null;
let lastPersistedSerialized: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function classifyStorageError(error: unknown): StorageWriteFailureReason {
  if (error instanceof DOMException) {
    if (error.name === "QuotaExceededError" || error.code === 22) {
      return "quota";
    }
    if (error.name === "SecurityError") {
      return "restricted";
    }
  }

  return "unknown";
}

function parseDatabase(raw: string): CampReadyDatabase | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      (parsed as { version: unknown }).version !== 1 ||
      !("trips" in parsed)
    ) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const legacyCategories = Array.isArray(record.categories)
      ? record.categories
      : null;

    const { database } = normalizeDatabaseDocument(parsed, {
      phase: "parse",
      legacyCategories: legacyCategories as TripRecord["categories"] | null,
    });

    return ensureSeededDatabase(database);
  } catch {
    return null;
  }
}

/** Drop removed fields and coerce corrupt persisted records — never throws. */
export function sanitizeDatabase(data: CampReadyDatabase): CampReadyDatabase {
  const { database } = normalizeDatabaseDocument(data, { phase: "sanitize" });
  return database;
}

function safeFinalizeDatabase(data: CampReadyDatabase): CampReadyDatabase {
  try {
    return finalizeDatabase(data);
  } catch {
    return finalizeDatabase(createEmptyDatabase());
  }
}

function finalizeDatabase(data: CampReadyDatabase): CampReadyDatabase {
  const sanitized = sanitizeDatabase(data);
  const hadSampleTrip = sanitized.trips.some(isSampleTrip);
  const seeded = ensureSeededDatabase(sanitized);
  memoryCache = seeded;

  if (isBrowser() && hadSampleTrip) {
    const serialized = trySerializeDatabase(seeded);
    if (serialized) {
      tryWriteLocalStorage(serialized);
      mirrorToLocalForage(serialized);
    }
  }

  return seeded;
}

function serializeDatabase(data: CampReadyDatabase): string {
  return JSON.stringify(data);
}

function trySerializeDatabase(data: CampReadyDatabase): string | null {
  try {
    return serializeDatabase(data);
  } catch {
    return null;
  }
}

export function tryWriteLocalStorage(serialized: string): StorageWriteResult {
  if (!isBrowser()) {
    return { ok: false, reason: "unknown" };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    notifyStorageWriteSuccess();
    return { ok: true };
  } catch (error) {
    const reason = classifyStorageError(error);
    notifyStorageWriteFailure(reason);
    return { ok: false, reason };
  }
}

/** Fire-and-forget mirror to IndexedDB; never surfaces errors to callers. */
function mirrorToLocalForage(serialized: string): void {
  void writeToLocalForage(serialized).catch(() => {
    // Durable offline mirror is best-effort; memory + localStorage remain primary.
  });
}

function persistSerializedDatabase(serialized: string): void {
  if (serialized === lastPersistedSerialized) {
    return;
  }

  const result = tryWriteLocalStorage(serialized);
  if (result.ok) {
    lastPersistedSerialized = serialized;
  }

  mirrorToLocalForage(serialized);
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

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (!raw) {
    memoryCache = createEmptyDatabase();
    return memoryCache;
  }

  const parsed = parseDatabase(raw) ?? createEmptyDatabase();
  return safeFinalizeDatabase(parsed);
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

  const serialized = trySerializeDatabase(data);
  if (!serialized) {
    return;
  }

  persistSerializedDatabase(serialized);
}

function tryFinalizeParsed(
  raw: string,
): { ok: true; database: CampReadyDatabase } | { ok: false } {
  const parsed = parseDatabase(raw);
  if (!parsed) {
    return { ok: false };
  }

  try {
    return { ok: true, database: finalizeDatabase(parsed) };
  } catch {
    return { ok: false };
  }
}

/** Hydrate memory + localStorage from localforage (e.g. first app launch). */
export async function hydrateDatabase(): Promise<HydrationResult> {
  if (!isBrowser()) {
    return { database: createEmptyDatabase(), recovered: false };
  }

  let sawCorruptStorage = false;

  try {
    let localRaw: string | null = null;
    try {
      localRaw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      localRaw = null;
    }

    if (localRaw) {
      const localResult = tryFinalizeParsed(localRaw);
      if (localResult.ok) {
        return { database: localResult.database, recovered: false };
      }

      sawCorruptStorage = true;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore corrupt or inaccessible localStorage during hydration.
      }
    }

    const remoteRaw = await readFromLocalForage();
    if (remoteRaw) {
      const remoteResult = tryFinalizeParsed(remoteRaw);
      if (remoteResult.ok) {
        const serialized = trySerializeDatabase(remoteResult.database);
        if (serialized) {
          tryWriteLocalStorage(serialized);
        }
        return {
          database: remoteResult.database,
          recovered: sawCorruptStorage,
          reason: sawCorruptStorage ? "corrupt" : undefined,
        };
      }

      sawCorruptStorage = true;
    }

    const seeded = safeFinalizeDatabase(createEmptyDatabase());
    writeDatabaseSync(seeded);
    return {
      database: seeded,
      recovered: sawCorruptStorage,
      reason: sawCorruptStorage ? "corrupt" : undefined,
    };
  } catch {
    const seeded = safeFinalizeDatabase(createEmptyDatabase());
    writeDatabaseSync(seeded);
    return {
      database: seeded,
      recovered: true,
      reason: "error",
    };
  }
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
  lastPersistedSerialized = null;

  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort clear; memory cache is already reset.
  }
  void clearLocalForage().catch(() => {
    // Ignore durable store clear failures.
  });
  notifyStorageWriteSuccess();
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
