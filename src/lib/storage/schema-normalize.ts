import type {
  CampReadyDatabase,
  Category,
  ChecklistTemplate,
  GearItem,
  GearItemStatus,
  TripLocation,
  TripRecord,
  VehiclePayloadSettings,
} from "@/types";
import { filterUserSavedTemplates } from "@/lib/templates";
import { DATABASE_VERSION } from "./constants";
import {
  createDefaultVehiclePayloadSettings,
  createEmptyDatabase,
  createGearItem,
  createTrip,
} from "./defaults";
import { logStorageRepair, getStorageAuditLog, type StorageAuditPhase } from "./storage-audit-log";

const GEAR_STATUSES: GearItemStatus[] = ["missing", "staged", "packed"];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface NormalizeDatabaseOptions {
  phase?: StorageAuditPhase;
  legacyCategories?: Category[] | null;
}

export interface NormalizeDatabaseResult {
  database: CampReadyDatabase;
  repairCount: number;
}

function audit(
  phase: StorageAuditPhase,
  action: "strip" | "repair" | "default",
  path: string,
  message: string,
): void {
  logStorageRepair({ phase, action, path, message });
}

function defaultTripDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function coerceIsoDate(value: unknown, path: string, phase: StorageAuditPhase): string {
  if (typeof value === "string" && ISO_DATE_PATTERN.test(value.trim())) {
    return value.trim();
  }

  audit(phase, "default", path, "Invalid or missing date. Using default.");
  return defaultTripDate();
}

function coerceGearItemStatus(
  value: unknown,
  path: string,
  phase: StorageAuditPhase,
): GearItemStatus {
  if (typeof value === "string" && GEAR_STATUSES.includes(value as GearItemStatus)) {
    return value as GearItemStatus;
  }

  if (value != null && value !== "") {
    audit(phase, "repair", path, "Invalid gear status. Defaulting to missing.");
  }

  return "missing";
}

function coerceWeightLbs(
  value: unknown,
  path: string,
  phase: StorageAuditPhase,
): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric < 0) {
    audit(phase, "repair", path, "Invalid weight. Removing value.");
    return undefined;
  }

  return numeric;
}

function normalizeLocation(
  value: unknown,
  path: string,
  phase: StorageAuditPhase,
): TripLocation | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "object") {
    audit(phase, "strip", path, "Malformed trip location removed.");
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const query = typeof record.query === "string" ? record.query.trim() : "";
  if (!query) {
    audit(phase, "strip", path, "Empty trip location query removed.");
    return undefined;
  }

  const location: TripLocation = { query };

  if (typeof record.latitude === "number" && Number.isFinite(record.latitude)) {
    location.latitude = record.latitude;
  }

  if (typeof record.longitude === "number" && Number.isFinite(record.longitude)) {
    location.longitude = record.longitude;
  }

  if (typeof record.resolvedName === "string" && record.resolvedName.trim()) {
    location.resolvedName = record.resolvedName.trim();
  }

  return location;
}

function normalizeGearItem(
  raw: unknown,
  fallbackCategoryId: string,
  path: string,
  phase: StorageAuditPhase,
): GearItem | null {
  if (typeof raw !== "object" || raw === null) {
    audit(phase, "strip", path, "Gear item is not an object. Dropped.");
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    audit(phase, "strip", path, "Gear item missing name. Dropped.");
    return null;
  }

  const categoryId =
    typeof record.category === "string" && record.category.trim()
      ? record.category.trim()
      : fallbackCategoryId;

  if (categoryId !== fallbackCategoryId && typeof record.category !== "string") {
    audit(phase, "repair", `${path}.category`, "Missing category reference. Assigned parent.");
  }

  const id =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : crypto.randomUUID();

  if (typeof record.id !== "string" || !record.id.trim()) {
    audit(phase, "repair", `${path}.id`, "Missing gear id. Generated replacement.");
  }

  const storageLocation =
    typeof record.storageLocation === "string" && record.storageLocation.trim()
      ? record.storageLocation.trim()
      : undefined;

  const status = coerceGearItemStatus(record.status, `${path}.status`, phase);
  const weight_lbs = coerceWeightLbs(record.weight_lbs, `${path}.weight_lbs`, phase);

  return createGearItem({
    id,
    name,
    category: categoryId,
    status,
    weight_lbs,
    storageLocation,
  });
}

function normalizeCategory(
  raw: unknown,
  path: string,
  phase: StorageAuditPhase,
): Category | null {
  if (typeof raw !== "object" || raw === null) {
    audit(phase, "strip", path, "Category is not an object. Dropped.");
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    audit(phase, "strip", path, "Category missing name. Dropped.");
    return null;
  }

  const categoryId =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : crypto.randomUUID();

  if (typeof record.id !== "string" || !record.id.trim()) {
    audit(phase, "repair", `${path}.id`, "Missing category id. Generated replacement.");
  }

  const rawItems = Array.isArray(record.items) ? record.items : [];
  if (!Array.isArray(record.items)) {
    audit(phase, "repair", `${path}.items`, "Missing items array. Treating as empty.");
  }

  const items = rawItems
    .map((item, index) =>
      normalizeGearItem(item, categoryId, `${path}.items[${index}]`, phase),
    )
    .filter((item): item is GearItem => item !== null)
    .map((item) => ({ ...item, category: categoryId }));

  return { id: categoryId, name, items };
}

function normalizeCategories(
  raw: unknown,
  path: string,
  phase: StorageAuditPhase,
): Category[] {
  if (!Array.isArray(raw)) {
    audit(phase, "repair", path, "Categories field is not an array. Using empty list.");
    return [];
  }

  return raw
    .map((category, index) => normalizeCategory(category, `${path}[${index}]`, phase))
    .filter((category): category is Category => category !== null);
}

function normalizeTripRecord(
  raw: unknown,
  index: number,
  options: NormalizeDatabaseOptions,
): TripRecord | null {
  const phase = options.phase ?? "sanitize";
  const path = `trips[${index}]`;

  if (typeof raw !== "object" || raw === null) {
    audit(phase, "strip", path, "Trip is not an object. Dropped.");
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    audit(phase, "strip", path, "Trip missing name. Dropped.");
    return null;
  }

  const legacyDate = typeof record.date === "string" ? record.date : undefined;
  const startDate = coerceIsoDate(
    record.startDate ?? legacyDate,
    `${path}.startDate`,
    phase,
  );
  let endDate = coerceIsoDate(record.endDate ?? legacyDate ?? startDate, `${path}.endDate`, phase);

  if (endDate.localeCompare(startDate) < 0) {
    audit(phase, "repair", `${path}.endDate`, "End date before start date. Aligned to start.");
    endDate = startDate;
  }

  const hasCategories = "categories" in record && Array.isArray(record.categories);
  const categories = hasCategories
    ? normalizeCategories(record.categories, `${path}.categories`, phase)
    : index === 0 && options.legacyCategories
      ? normalizeCategories(options.legacyCategories, "legacy.categories", phase)
      : [];

  if (!hasCategories && index === 0 && options.legacyCategories) {
    audit(phase, "repair", path, "Migrated legacy root categories onto first trip.");
  } else if (!hasCategories) {
    audit(phase, "repair", `${path}.categories`, "Missing categories. Using empty list.");
  }

  const now = new Date().toISOString();
  const tripId =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : crypto.randomUUID();

  if (typeof record.id !== "string" || !record.id.trim()) {
    audit(phase, "repair", `${path}.id`, "Missing trip id. Generated replacement.");
  }

  return {
    ...createTrip({ id: tripId, name, startDate, endDate }),
    location: normalizeLocation(record.location, `${path}.location`, phase),
    categories,
    checklistTemplateId:
      typeof record.checklistTemplateId === "string" &&
      record.checklistTemplateId.trim()
        ? record.checklistTemplateId.trim()
        : undefined,
    createdAt:
      typeof record.createdAt === "string" && record.createdAt.trim()
        ? record.createdAt
        : now,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt
        : now,
  };
}

function normalizeTemplate(
  raw: unknown,
  index: number,
  phase: StorageAuditPhase,
): ChecklistTemplate | null {
  const path = `templates[${index}]`;

  if (typeof raw !== "object" || raw === null) {
    audit(phase, "strip", path, "Template is not an object. Dropped.");
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const id = typeof record.id === "string" ? record.id.trim() : "";

  if (!id || !name) {
    audit(phase, "strip", path, "Template missing id or name. Dropped.");
    return null;
  }

  return {
    id,
    name,
    description:
      typeof record.description === "string" ? record.description : "",
    categories: normalizeCategories(record.categories, `${path}.categories`, phase),
  };
}

function normalizeTemplates(raw: unknown, phase: StorageAuditPhase): ChecklistTemplate[] {
  if (!Array.isArray(raw)) {
    audit(phase, "repair", "templates", "Templates field is not an array. Using empty list.");
    return [];
  }

  return raw
    .map((template, index) => normalizeTemplate(template, index, phase))
    .filter((template): template is ChecklistTemplate => template !== null);
}

function normalizeVehiclePayload(
  raw: unknown,
  phase: StorageAuditPhase,
): VehiclePayloadSettings {
  if (raw == null) {
    return createDefaultVehiclePayloadSettings();
  }

  if (typeof raw !== "object") {
    audit(phase, "strip", "vehiclePayload", "Malformed vehicle payload settings removed.");
    return createDefaultVehiclePayloadSettings();
  }

  const record = raw as Record<string, unknown>;
  const alarmEnabled = record.alarmEnabled === true;

  if (record.alarmEnabled != null && typeof record.alarmEnabled !== "boolean") {
    audit(
      phase,
      "repair",
      "vehiclePayload.alarmEnabled",
      "Invalid alarm flag. Defaulting to disabled.",
    );
  }

  const capacity = coerceWeightLbs(
    record.maxPayloadCapacityLbs,
    "vehiclePayload.maxPayloadCapacityLbs",
    phase,
  );

  const settings: VehiclePayloadSettings = { alarmEnabled };
  if (typeof capacity === "number" && capacity > 0) {
    settings.maxPayloadCapacityLbs = capacity;
  } else if (capacity === 0) {
    audit(
      phase,
      "strip",
      "vehiclePayload.maxPayloadCapacityLbs",
      "Non-positive capacity removed.",
    );
  }

  return settings;
}

/**
 * Deeply validates and repairs a parsed database document.
 * Never throws. Corrupt records are stripped or coerced with audit logging.
 */
export function normalizeDatabaseDocument(
  raw: unknown,
  options: NormalizeDatabaseOptions = {},
): NormalizeDatabaseResult {
  const phase = options.phase ?? "sanitize";
  let repairCount = 0;

  const countBefore = getStorageAuditLog().length;

  if (typeof raw !== "object" || raw === null) {
    audit(phase, "strip", "root", "Database root is not an object. Using empty database.");
    return { database: createEmptyDatabase(), repairCount: 1 };
  }

  const record = raw as Record<string, unknown>;
  const version = record.version;

  if (version !== DATABASE_VERSION) {
    audit(
      phase,
      "repair",
      "version",
      `Unexpected version (${String(version)}). Coercing to ${DATABASE_VERSION}.`,
    );
  }

  const rawTrips = Array.isArray(record.trips) ? record.trips : [];
  if (!Array.isArray(record.trips)) {
    audit(phase, "repair", "trips", "Trips field is not an array. Using empty list.");
  }

  const legacyCategories = options.legacyCategories ?? null;
  const trips = rawTrips
    .map((trip, index) => normalizeTripRecord(trip, index, { ...options, phase, legacyCategories }))
    .filter((trip): trip is TripRecord => trip !== null);

  const templates = filterUserSavedTemplates(
    normalizeTemplates(record.templates, phase),
  );
  const templateIds = new Set(templates.map((template) => template.id));
  const normalizedTrips = trips.map((trip, index) => {
    if (
      trip.checklistTemplateId &&
      !templateIds.has(trip.checklistTemplateId)
    ) {
      audit(
        phase,
        "repair",
        `trips[${index}].checklistTemplateId`,
        "Saved checklist reference not found. Clearing selection.",
      );
      return { ...trip, checklistTemplateId: undefined };
    }

    return trip;
  });

  let activeTripId: string | null = null;
  if (record.activeTripId === null) {
    activeTripId = null;
  } else if (typeof record.activeTripId === "string" && record.activeTripId.trim()) {
    activeTripId = record.activeTripId.trim();
    if (!normalizedTrips.some((trip) => trip.id === activeTripId)) {
      audit(
        phase,
        "repair",
        "activeTripId",
        "Active trip id not found. Selecting first available trip.",
      );
      activeTripId = normalizedTrips[0]?.id ?? null;
    }
  } else if (normalizedTrips.length > 0) {
    audit(phase, "default", "activeTripId", "Missing active trip id. Selecting first trip.");
    activeTripId = normalizedTrips[0]?.id ?? null;
  }

  repairCount = getStorageAuditLog().length - countBefore;

  const vehiclePayload = normalizeVehiclePayload(record.vehiclePayload, phase);

  return {
    database: {
      version: DATABASE_VERSION,
      trips: normalizedTrips,
      templates,
      activeTripId,
      vehiclePayload,
    },
    repairCount,
  };
}
