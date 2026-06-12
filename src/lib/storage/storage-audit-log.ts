export type StorageAuditPhase = "parse" | "sanitize" | "hydrate";

export type StorageAuditAction = "strip" | "repair" | "default";

export interface StorageAuditEntry {
  timestamp: string;
  phase: StorageAuditPhase;
  action: StorageAuditAction;
  path: string;
  message: string;
}

const MAX_AUDIT_ENTRIES = 48;
const auditLog: StorageAuditEntry[] = [];

/** Records a defensive repair or strip during database normalization. */
export function logStorageRepair(entry: Omit<StorageAuditEntry, "timestamp">): void {
  const record: StorageAuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  auditLog.push(record);
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog.shift();
  }

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(
      `[CampReady storage:${entry.phase}] ${entry.action} ${entry.path} — ${entry.message}`,
    );
  }
}

export function getStorageAuditLog(): readonly StorageAuditEntry[] {
  return auditLog;
}

export function clearStorageAuditLog(): void {
  auditLog.length = 0;
}
