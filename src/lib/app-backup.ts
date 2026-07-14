import { downloadTextFile } from "@/lib/download-text-file";
import { ensureSeededDatabase, normalizeDatabaseDocument } from "@/lib/storage";
import type { CampReadyDatabase } from "@/types";

export const CAMPREADY_BACKUP_FORMAT = "campready-full-backup" as const;
export const CAMPREADY_BACKUP_VERSION = 1 as const;

export interface CampReadyBackupDocument {
  version: typeof CAMPREADY_BACKUP_VERSION;
  format: typeof CAMPREADY_BACKUP_FORMAT;
  exportedAt: string;
  app: "CampReady";
  database: CampReadyDatabase;
}

export type CampReadyBackupValidationResult =
  | { ok: true; database: CampReadyDatabase; repairCount: number }
  | { ok: false; message: string };

function backupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `campready-backup-${date}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatCampReadyBackup(
  database: CampReadyDatabase,
): string {
  const document: CampReadyBackupDocument = {
    version: CAMPREADY_BACKUP_VERSION,
    format: CAMPREADY_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    app: "CampReady",
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
    return { ok: false, message: "Backup file is not a CampReady backup." };
  }

  if (parsed.format !== CAMPREADY_BACKUP_FORMAT) {
    return { ok: false, message: "Select a CampReady backup file." };
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
