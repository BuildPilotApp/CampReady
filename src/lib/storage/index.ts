export { STORAGE_KEY, DATABASE_VERSION } from "./constants";
export {
  createEmptyDatabase,
  createTrip,
  createCategory,
  createGearItem,
  getTripStats,
  touchTrip,
} from "./defaults";
export {
  ensureSeededDatabase,
  cloneCategories,
  isEmptyDatabase,
} from "./seed";
export {
  readDatabaseSync,
  writeDatabaseSync,
  readDatabase,
  writeDatabase,
  hydrateDatabase,
  clearDatabase,
  isStorageAvailable,
  sanitizeDatabase,
  tryWriteLocalStorage,
  type HydrationResult,
  type HydrationRecoveryReason,
  type StorageWriteResult,
} from "./database";
export { normalizeDatabaseDocument } from "./schema-normalize";
export {
  logStorageRepair,
  getStorageAuditLog,
  clearStorageAuditLog,
  type StorageAuditEntry,
} from "./storage-audit-log";
export {
  readUiSessionState,
  writeUiSessionState,
  clearUiSessionState,
  UI_SESSION_STORAGE_KEY,
  type UiSessionState,
} from "./ui-session-state";
export {
  subscribeStoragePersistenceStatus,
  subscribeImportValidationFailure,
  notifyImportValidationFailure,
  clearImportValidationFailure,
  isStoragePersistenceBlocked,
  type StorageWriteFailureReason,
} from "./storage-notifications";
