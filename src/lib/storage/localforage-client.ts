import localforage from "localforage";
import { STORAGE_KEY } from "./constants";

let configured = false;

/**
 * IndexedDB mirror for durable offline backup, separate from synchronous localStorage.
 * Does not duplicate the localStorage driver to avoid redundant writes to the same store.
 */
export function getLocalForage(): LocalForage {
  if (!configured) {
    localforage.config({
      name: "campready",
      storeName: "offline",
      description: "CampSync IndexedDB offline mirror",
      driver: [localforage.INDEXEDDB],
    });
    configured = true;
  }

  return localforage;
}

export async function readFromLocalForage(): Promise<string | null> {
  try {
    const store = getLocalForage();
    const value = await store.getItem<string>(STORAGE_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function writeToLocalForage(serialized: string): Promise<void> {
  try {
    const store = getLocalForage();
    await store.setItem(STORAGE_KEY, serialized);
  } catch {
    // Caller decides whether to retry or fall back; never throw to UI paths.
  }
}

export async function clearLocalForage(): Promise<void> {
  try {
    const store = getLocalForage();
    await store.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort durable store clear.
  }
}
