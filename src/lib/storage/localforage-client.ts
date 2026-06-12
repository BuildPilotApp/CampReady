import localforage from "localforage";
import { STORAGE_KEY } from "./constants";

let configured = false;

/** Configure localforage once; prefers localStorage for instant offline writes. */
export function getLocalForage(): LocalForage {
  if (!configured) {
    localforage.config({
      name: "campready",
      storeName: "offline",
      description: "CampReady offline checklist data",
      driver: [
        localforage.LOCALSTORAGE,
        localforage.INDEXEDDB,
        localforage.WEBSQL,
      ],
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
  const store = getLocalForage();
  await store.removeItem(STORAGE_KEY);
}
