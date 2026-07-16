import { downloadTextFile } from "@/lib/download-text-file";
import { ensureSeededDatabase, normalizeDatabaseDocument } from "@/lib/storage";
import type { CampReadyDatabase } from "@/types";

/** Current backup format written by CampSync. */
export const CAMPSYNC_BACKUP_FORMAT = "campsync-full-backup" as const;
/** Legacy CampReady backups still accepted on restore. */
export const CAMPREADY_BACKUP_FORMAT = "campready-full-backup" as const;
export const CAMPREADY_BACKUP_VERSION = 1 as const;

const ACCEPTED_BACKUP_FORMATS = new Set<string>([
  CAMPSYNC_BACKUP_FORMAT,
  CAMPREADY_BACKUP_FORMAT,
]);

export interface CampReadyBackupDocument {
  version: typeof CAMPREADY_BACKUP_VERSION;
  format: typeof CAMPSYNC_BACKUP_FORMAT | typeof CAMPREADY_BACKUP_FORMAT;
  exportedAt: string;
  app: "CampSync" | "CampReady";
  database: CampReadyDatabase;
}

export type CampReadyBackupValidationResult =
  | { ok: true; database: CampReadyDatabase; repairCount: number }
  | { ok: false; message: string };

function backupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  // .json so Android file pickers can find and open backups reliably.
  return `campsync-backup-${date}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatCampReadyBackup(
  database: CampReadyDatabase,
): string {
  const document: CampReadyBackupDocument = {
    version: CAMPREADY_BACKUP_VERSION,
    format: CAMPSYNC_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    app: "CampSync",
    database: ensureSeededDatabase(database),
  };

  return JSON.stringify(document, null, 2);
}

export async function downloadCampReadyBackup(
  database: CampReadyDatabase,
): Promise<boolean> {
  return downloadTextFile(
    formatCampReadyBackup(database),
    backupFilename(),
    "application/json",
  );
}

export function validateCampReadyBackup(
  raw: string,
): CampReadyBackupValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Backup file could not be read." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, message: "Backup file is not a CampSync backup." };
  }

  if (
    typeof parsed.format !== "string" ||
    !ACCEPTED_BACKUP_FORMATS.has(parsed.format)
  ) {
    return {
      ok: false,
      message:
        "Select a CampSync backup JSON file (legacy CampReady backups are also supported).",
    };
  }

  if (parsed.version !== CAMPREADY_BACKUP_VERSION) {
    return { ok: false, message: "This backup version is not supported." };
  }

  if (!("database" in parsed)) {
    return { ok: false, message: "Backup file is missing app data." };
  }

  const { database, repairCount } = normalizeDatabaseDocument(parsed.database, {
    phase: "sanitize",
  });

  return {
    ok: true,
    database: ensureSeededDatabase(database),
    repairCount,
  };
}
