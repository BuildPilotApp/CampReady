export type StorageWriteFailureReason = "quota" | "restricted" | "unknown";

type StoragePersistenceListener = (
  blocked: boolean,
  reason?: StorageWriteFailureReason,
) => void;

type ImportValidationListener = (message: string | null) => void;

const storageListeners = new Set<StoragePersistenceListener>();
const importListeners = new Set<ImportValidationListener>();

let storagePersistenceBlocked = false;
let lastStorageFailureReason: StorageWriteFailureReason | undefined;

export function subscribeStoragePersistenceStatus(
  listener: StoragePersistenceListener,
): () => void {
  storageListeners.add(listener);
  listener(storagePersistenceBlocked, lastStorageFailureReason);
  return () => storageListeners.delete(listener);
}

function emitStoragePersistenceStatus(): void {
  for (const listener of storageListeners) {
    listener(storagePersistenceBlocked, lastStorageFailureReason);
  }
}

export function notifyStorageWriteSuccess(): void {
  if (!storagePersistenceBlocked && !lastStorageFailureReason) {
    return;
  }

  storagePersistenceBlocked = false;
  lastStorageFailureReason = undefined;
  emitStoragePersistenceStatus();
}

export function notifyStorageWriteFailure(reason: StorageWriteFailureReason): void {
  storagePersistenceBlocked = true;
  lastStorageFailureReason = reason;
  emitStoragePersistenceStatus();
}

export function isStoragePersistenceBlocked(): boolean {
  return storagePersistenceBlocked;
}

export function subscribeImportValidationFailure(
  listener: ImportValidationListener,
): () => void {
  importListeners.add(listener);
  return () => importListeners.delete(listener);
}

export function notifyImportValidationFailure(message: string): void {
  for (const listener of importListeners) {
    listener(message);
  }
}

export function clearImportValidationFailure(): void {
  for (const listener of importListeners) {
    listener(null);
  }
}
