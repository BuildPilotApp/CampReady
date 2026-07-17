import { STATUS_LABELS } from "@/lib/gear-status";
import { MEAL_STATUS_LABELS } from "@/lib/export-checklist";
import {
  CHECKLIST_EXPORT_VERSION,
  isAcceptedChecklistExportFormat,
  type ChecklistExportCategory,
  type ChecklistExportDocument,
} from "@/lib/checklist-export-format";
import { createCategory, createGearItem, createMealPrepItem } from "@/lib/storage";
import {
  clearImportValidationFailure,
  notifyImportValidationFailure,
} from "@/lib/storage/storage-notifications";
import { upsertMealPrepDayItems } from "@/lib/meal-prep";
import type {
  Category,
  GearItemStatus,
  MealItemStatus,
  MealPrepDay,
  MealPrepItem,
} from "@/types";

const GEAR_STATUSES: GearItemStatus[] = ["missing", "staged", "packed"];
/** ~2 MB limit prevents main-thread stalls on large imports in the field. */
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

const STATUS_BY_LABEL: Record<string, GearItemStatus> = {
  [STATUS_LABELS.missing]: "missing",
  [STATUS_LABELS.staged]: "staged",
  [STATUS_LABELS.packed]: "packed",
  missing: "missing",
  staged: "staged",
  packed: "packed",
};

const MEAL_STATUS_BY_LABEL: Record<string, MealItemStatus> = {
  [MEAL_STATUS_LABELS.available]: "available",
  [MEAL_STATUS_LABELS.consumed]: "consumed",
  available: "available",
  consumed: "consumed",
};

export interface ImportValidationError {
  path: string;
  message: string;
}

export interface MealImportItem {
  dayNumber: number;
  title: string;
  status: MealItemStatus;
  recipeNotes?: string;
}

export interface ValidatedChecklistImport {
  categories: ChecklistExportCategory[];
  mealItems?: MealImportItem[];
  sourceFormat: "json" | "csv" | "xlsx";
}

export interface ImportMergeResult {
  categories: Category[];
  categoriesAdded: number;
  categoriesMerged: number;
  itemsAdded: number;
  itemsUpdated: number;
  mealPrepDays?: MealPrepDay[];
  mealsAdded: number;
  mealsUpdated: number;
}

export type ImportValidationResult =
  | { ok: true; data: ValidatedChecklistImport }
  | { ok: false; errors: ImportValidationError[] };

export interface ValidateChecklistImportOptions {
  /** Byte length of the source file, when known. */
  fileSize?: number;
  /** Skip global import warning banner (programmatic recovery flows). */
  suppressNotification?: boolean;
}

/** User-facing summary of one or more import validation errors. */
export function formatImportValidationErrors(errors: ImportValidationError[]): string {
  if (errors.length === 0) {
    return "Import file is invalid or malformed.";
  }

  const preview = errors.slice(0, 3).map((error) => error.message);
  const suffix =
    errors.length > 3 ? ` (+${errors.length - 3} more issue${errors.length - 3 === 1 ? "" : "s"})` : "";

  return `${preview.join(" ")}${suffix}`;
}

function surfaceImportFailure(
  result: Extract<ImportValidationResult, { ok: false }>,
  suppressNotification?: boolean,
): ImportValidationResult {
  if (!suppressNotification) {
    notifyImportValidationFailure(formatImportValidationErrors(result.errors));
  }
  return result;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMealStatus(
  value: unknown,
  path: string,
  errors: ImportValidationError[],
): MealItemStatus | null {
  if (value == null || value === "") {
    return "available";
  }

  if (typeof value !== "string") {
    errors.push({ path, message: "Meal status must be text when provided." });
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "available";
  }

  const status =
    MEAL_STATUS_BY_LABEL[trimmed] ?? MEAL_STATUS_BY_LABEL[trimmed.toLowerCase()];
  if (!status) {
    errors.push({
      path,
      message: `Meal status must be one of: Available, Consumed.`,
    });
    return null;
  }

  return status;
}

function parseMealDay(
  value: unknown,
  path: string,
  errors: ImportValidationError[],
): number | null {
  if (value == null || value === "") {
    errors.push({ path, message: "Day number is required for Meal rows." });
    return null;
  }

  const numeric =
    typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(numeric) || numeric < 1) {
    errors.push({
      path,
      message: "Day must be a positive whole number (1, 2, 3…).",
    });
    return null;
  }

  return numeric;
}

function parseStatus(value: unknown, path: string, errors: ImportValidationError[]): GearItemStatus | null {
  if (value == null || value === "") {
    return "missing";
  }

  if (typeof value !== "string") {
    errors.push({ path, message: "Status must be text when provided." });
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "missing";
  }

  const status = STATUS_BY_LABEL[trimmed] ?? STATUS_BY_LABEL[trimmed.toLowerCase()];
  if (!status) {
    errors.push({
      path,
      message: `Status must be one of: ${GEAR_STATUSES.join(", ")} or ${Object.values(STATUS_LABELS).join(", ")}.`,
    });
    return null;
  }

  return status;
}

function parseOptionalWeight(
  value: unknown,
  path: string,
  errors: ImportValidationError[],
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
    errors.push({ path, message: "Weight must be a non-negative number." });
    return undefined;
  }

  return numeric;
}

function parseOptionalStorage(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function validateExportItem(
  value: unknown,
  path: string,
  errors: ImportValidationError[],
): ChecklistExportCategory["items"][number] | null {
  if (!isRecord(value)) {
    errors.push({ path, message: "Item must be an object." });
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    errors.push({ path: `${path}.name`, message: "Item name is required." });
    return null;
  }

  const status = parseStatus(value.status, `${path}.status`, errors);
  if (!status) {
    return null;
  }

  const weight_lbs = parseOptionalWeight(value.weight_lbs, `${path}.weight_lbs`, errors);
  const storageLocation = parseOptionalStorage(value.storageLocation);

  return {
    name,
    status,
    ...(weight_lbs != null ? { weight_lbs } : {}),
    ...(storageLocation ? { storageLocation } : {}),
  };
}

function validateExportCategory(
  value: unknown,
  path: string,
  errors: ImportValidationError[],
): ChecklistExportCategory | null {
  if (!isRecord(value)) {
    errors.push({ path, message: "Category must be an object." });
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    errors.push({ path: `${path}.name`, message: "Category name is required." });
    return null;
  }

  if (!("items" in value) || !Array.isArray(value.items)) {
    errors.push({ path: `${path}.items`, message: "Category items must be an array." });
    return null;
  }

  const items: ChecklistExportCategory["items"] = [];
  value.items.forEach((item, index) => {
    const parsed = validateExportItem(item, `${path}.items[${index}]`, errors);
    if (parsed) {
      items.push(parsed);
    }
  });

  return { name, items };
}

function validateCategoriesArray(
  categories: unknown[],
  errors: ImportValidationError[],
): ChecklistExportCategory[] {
  const parsed: ChecklistExportCategory[] = [];

  categories.forEach((category, index) => {
    const next = validateExportCategory(category, `categories[${index}]`, errors);
    if (next) {
      parsed.push(next);
    }
  });

  return parsed;
}

function validateChecklistExportDocument(
  value: unknown,
  errors: ImportValidationError[],
): ChecklistExportCategory[] | null {
  if (!isRecord(value)) {
    errors.push({ path: "root", message: "JSON must be an object." });
    return null;
  }

  if (value.version !== CHECKLIST_EXPORT_VERSION) {
    errors.push({
      path: "version",
      message: `Expected version ${CHECKLIST_EXPORT_VERSION}.`,
    });
  }

  if (!isAcceptedChecklistExportFormat(value.format)) {
    errors.push({
      path: "format",
      message: 'Expected format "campsync-checklist" (or legacy "campready-checklist").',
    });
  }

  if (!Array.isArray(value.categories)) {
    errors.push({ path: "categories", message: "Categories must be an array." });
    return null;
  }

  return validateCategoriesArray(value.categories, errors);
}

function extractCategoriesFromJson(
  parsed: unknown,
  errors: ImportValidationError[],
): ChecklistExportCategory[] | null {
  if (Array.isArray(parsed)) {
    const categories = validateCategoriesArray(parsed, errors);
    return errors.length === 0 ? categories : null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  if (isAcceptedChecklistExportFormat(parsed.format) || parsed.version === CHECKLIST_EXPORT_VERSION) {
    const categories = validateChecklistExportDocument(parsed, errors);
    return errors.length === 0 ? categories : null;
  }

  if (Array.isArray(parsed.categories)) {
    const categories = validateCategoriesArray(parsed.categories, errors);
    return errors.length === 0 ? categories : null;
  }

  return null;
}

interface CsvParseResult {
  rows: string[][];
  anomalies: ImportValidationError[];
}

function parseCsvRows(raw: string): CsvParseResult {
  const rows: string[][] = [];
  const anomalies: ImportValidationError[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (inQuotes) {
    anomalies.push({
      path: "csv.parse",
      message: "CSV appears malformed. A quoted field was not closed.",
    });
  }

  return {
    rows: rows.filter((entry) => entry.some((cell) => cell.trim().length > 0)),
    anomalies,
  };
}

const LEGACY_CSV_HEADERS = ["category", "item", "status", "weight (lbs)", "storage"];
const COMBINED_CSV_HEADERS = [
  "type",
  "category",
  "item",
  "status",
  "weight (lbs)",
  "storage",
  "day",
  "recipe notes",
];

function isLegacyCsvHeader(header: string[]): boolean {
  return (
    header.length >= 3 &&
    header[0] === LEGACY_CSV_HEADERS[0] &&
    header[1] === LEGACY_CSV_HEADERS[1] &&
    header[2] === LEGACY_CSV_HEADERS[2]
  );
}

function isCombinedCsvHeader(header: string[]): boolean {
  return (
    header.length >= COMBINED_CSV_HEADERS.length &&
    COMBINED_CSV_HEADERS.every((expected, index) => header[index] === expected)
  );
}

function validateChecklistTableRows(
  rows: string[][],
  sourceFormat: "csv" | "xlsx",
): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const pathRoot = sourceFormat === "xlsx" ? "xlsx" : "csv";

  if (rows.length === 0) {
    errors.push({ path: pathRoot, message: `${pathRoot.toUpperCase()} file is empty.` });
    return { ok: false, errors };
  }

  const header = rows[0]!.map((cell) => cell.trim().toLowerCase());
  const combined = isCombinedCsvHeader(header);
  const legacy = !combined && isLegacyCsvHeader(header);

  if (!combined && !legacy) {
    errors.push({
      path: `${pathRoot}.header`,
      message:
        'Spreadsheet must start with headers: Type, Category, Item, Status, Weight (lbs), Storage, Day, Recipe Notes (or legacy Category, Item, Status, Weight (lbs), Storage).',
    });
    return { ok: false, errors };
  }

  const categoryMap = new Map<string, ChecklistExportCategory>();
  const mealItems: MealImportItem[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const path = `${pathRoot}.rows[${rowIndex + 1}]`;

    if (legacy) {
      const categoryName = row[0]?.trim() ?? "";
      const itemName = row[1]?.trim() ?? "";

      if (!categoryName) {
        errors.push({ path: `${path}.category`, message: "Category name is required." });
        return;
      }

      if (!itemName) {
        errors.push({ path: `${path}.item`, message: "Item name is required." });
        return;
      }

      const status = parseStatus(row[2], `${path}.status`, errors);
      if (!status) {
        return;
      }

      const weight_lbs = parseOptionalWeight(row[3], `${path}.weight`, errors);
      const storageLocation = parseOptionalStorage(row[4]);

      const key = normalizeName(categoryName);
      const category = categoryMap.get(key) ?? { name: categoryName, items: [] };
      category.items.push({
        name: itemName,
        status,
        ...(weight_lbs != null ? { weight_lbs } : {}),
        ...(storageLocation ? { storageLocation } : {}),
      });
      categoryMap.set(key, category);
      return;
    }

    const typeRaw = (row[0]?.trim() ?? "").toLowerCase();
    const isMeal = typeRaw === "meal";
    const isGear = typeRaw === "gear" || typeRaw === "";

    if (!isMeal && !isGear) {
      errors.push({
        path: `${path}.type`,
        message: 'Type must be "Gear" or "Meal".',
      });
      return;
    }

    if (isMeal) {
      const title = row[2]?.trim() ?? "";
      if (!title) {
        errors.push({ path: `${path}.item`, message: "Meal item title is required." });
        return;
      }

      const dayNumber = parseMealDay(row[6], `${path}.day`, errors);
      if (dayNumber == null) {
        return;
      }

      const status = parseMealStatus(row[3], `${path}.status`, errors);
      if (!status) {
        return;
      }

      const recipeNotes = row[7]?.trim() || undefined;
      mealItems.push({
        dayNumber,
        title,
        status,
        ...(recipeNotes ? { recipeNotes } : {}),
      });
      return;
    }

    const categoryName = row[1]?.trim() ?? "";
    const itemName = row[2]?.trim() ?? "";

    if (!categoryName) {
      errors.push({ path: `${path}.category`, message: "Category name is required." });
      return;
    }

    if (!itemName) {
      errors.push({ path: `${path}.item`, message: "Item name is required." });
      return;
    }

    const status = parseStatus(row[3], `${path}.status`, errors);
    if (!status) {
      return;
    }

    const weight_lbs = parseOptionalWeight(row[4], `${path}.weight`, errors);
    const storageLocation = parseOptionalStorage(row[5]);

    const key = normalizeName(categoryName);
    const category = categoryMap.get(key) ?? { name: categoryName, items: [] };
    category.items.push({
      name: itemName,
      status,
      ...(weight_lbs != null ? { weight_lbs } : {}),
      ...(storageLocation ? { storageLocation } : {}),
    });
    categoryMap.set(key, category);
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const categories = [...categoryMap.values()];
  const hasGear = categories.some((category) => category.items.length > 0);
  const hasMeals = mealItems.length > 0;

  if (!hasGear && !hasMeals) {
    errors.push({
      path: "categories",
      message:
        "This list is empty. Add at least one gear or meal item before importing.",
    });
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      sourceFormat,
      categories,
      ...(hasMeals ? { mealItems } : {}),
    },
  };
}

function validateChecklistCsv(raw: string): ImportValidationResult {
  const { rows, anomalies } = parseCsvRows(raw.trim());
  if (anomalies.length > 0) {
    return { ok: false, errors: anomalies };
  }
  return validateChecklistTableRows(rows, "csv");
}

function cellToImportString(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && "text" in value && typeof (value as { text: unknown }).text === "string") {
    return (value as { text: string }).text;
  }
  if (typeof value === "object" && "result" in value) {
    const result = (value as { result: unknown }).result;
    if (result == null) {
      return "";
    }
    if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
      return String(result);
    }
  }
  return String(value);
}

export async function parseChecklistXlsxRows(
  data: ArrayBuffer,
): Promise<string[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return [];
  }

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    for (let col = 1; col <= COMBINED_CSV_HEADERS.length; col += 1) {
      values.push(cellToImportString(row.getCell(col).value));
    }
    if (values.some((cell) => cell.trim().length > 0)) {
      rows.push(values);
    }
  });
  return rows;
}

export async function validateChecklistXlsx(
  data: ArrayBuffer,
): Promise<ImportValidationResult> {
  try {
    const rows = await parseChecklistXlsxRows(data);
    return validateChecklistTableRows(rows, "xlsx");
  } catch {
    return {
      ok: false,
      errors: [
        {
          path: "xlsx",
          message: "Spreadsheet could not be parsed. Export a CampSync .xlsx or use CSV/JSON.",
        },
      ],
    };
  }
}

export function isSpreadsheetImportFile(filename?: string, mimeType?: string): boolean {
  const extension = filename?.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xlsm") {
    return true;
  }
  const mime = mimeType?.toLowerCase() ?? "";
  return (
    mime.includes("spreadsheetml") ||
    mime === "application/vnd.ms-excel" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

export function detectImportFormat(
  content: string,
  filename?: string,
): "json" | "csv" | "xlsx" {
  const extension = filename?.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xlsm") {
    return "xlsx";
  }
  if (extension === "csv") {
    return "csv";
  }
  if (extension === "json") {
    return "json";
  }

  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  return "csv";
}

export function validateChecklistJson(raw: string): ImportValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errors: [{ path: "json", message: "File is not valid JSON." }],
    };
  }

  const errors: ImportValidationError[] = [];
  const categories = extractCategoriesFromJson(parsed, errors);

  if (!categories) {
    if (errors.length === 0) {
      errors.push({
        path: "root",
        message:
          'JSON must be a CampSync checklist export, a categories array, or an object with a "categories" array.',
      });
    }
    return { ok: false, errors };
  }

  if (categories.length === 0 || categories.every((category) => category.items.length === 0)) {
    return {
      ok: false,
      errors: [
        {
          path: "categories",
          message: "This list is empty. Add at least one gear item before importing.",
        },
      ],
    };
  }

  return {
    ok: true,
    data: {
      sourceFormat: "json",
      categories,
    },
  };
}

export function validateChecklistImport(
  content: string,
  filename?: string,
  options?: ValidateChecklistImportOptions,
): ImportValidationResult {
  try {
    const byteLength =
      options?.fileSize ?? (typeof TextEncoder !== "undefined" ? new TextEncoder().encode(content).length : content.length);

    if (byteLength > MAX_IMPORT_FILE_BYTES) {
      return surfaceImportFailure(
        {
          ok: false,
          errors: [
            {
              path: "file.size",
              message: `Import file is too large (max ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))} MB).`,
            },
          ],
        },
        options?.suppressNotification,
      );
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return surfaceImportFailure(
        {
          ok: false,
          errors: [{ path: "file", message: "Import file is empty." }],
        },
        options?.suppressNotification,
      );
    }

    const format = detectImportFormat(content, filename);
    if (format === "xlsx") {
      return surfaceImportFailure(
        {
          ok: false,
          errors: [
            {
              path: "xlsx",
              message: "Use the file picker to import spreadsheet (.xlsx) files.",
            },
          ],
        },
        options?.suppressNotification,
      );
    }

    const result =
      format === "json" ? validateChecklistJson(content) : validateChecklistCsv(content);

    if (result.ok) {
      clearImportValidationFailure();
      return result;
    }

    return surfaceImportFailure(result, options?.suppressNotification);
  } catch {
    return surfaceImportFailure(
      {
        ok: false,
        errors: [
          {
            path: "import",
            message: "Import file could not be parsed safely. Check the format and try again.",
          },
        ],
      },
      options?.suppressNotification,
    );
  }
}

/** Validates JSON, CSV, or XLSX checklist imports from a File. */
export async function validateChecklistImportFile(
  file: File,
  options?: ValidateChecklistImportOptions,
): Promise<ImportValidationResult> {
  try {
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return surfaceImportFailure(
        {
          ok: false,
          errors: [
            {
              path: "file.size",
              message: `Import file is too large (max ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))} MB).`,
            },
          ],
        },
        options?.suppressNotification,
      );
    }

    if (isSpreadsheetImportFile(file.name, file.type)) {
      const buffer = await file.arrayBuffer();
      const result = await validateChecklistXlsx(buffer);
      if (result.ok) {
        clearImportValidationFailure();
        return result;
      }
      return surfaceImportFailure(result, options?.suppressNotification);
    }

    const content = await file.text();
    return validateChecklistImport(content, file.name, {
      ...options,
      fileSize: file.size,
    });
  } catch {
    return surfaceImportFailure(
      {
        ok: false,
        errors: [
          {
            path: "import",
            message: "Import file could not be parsed safely. Check the format and try again.",
          },
        ],
      },
      options?.suppressNotification,
    );
  }
}

export function mergeImportedCategories(
  existing: Category[],
  imported: ChecklistExportCategory[],
): ImportMergeResult {
  const categories = existing.map((category) => ({
    ...category,
    items: [...category.items],
  }));

  let categoriesAdded = 0;
  let categoriesMerged = 0;
  let itemsAdded = 0;
  let itemsUpdated = 0;

  for (const importedCategory of imported) {
    const matchIndex = categories.findIndex(
      (category) => normalizeName(category.name) === normalizeName(importedCategory.name),
    );

    if (matchIndex === -1) {
      const category = createCategory({ name: importedCategory.name });
      category.items = importedCategory.items.map((item) =>
        createGearItem({
          name: item.name,
          category: category.id,
          status: item.status,
          weight_lbs: item.weight_lbs,
          storageLocation: item.storageLocation,
        }),
      );
      categories.unshift(category);
      categoriesAdded += 1;
      itemsAdded += category.items.length;
      continue;
    }

    categoriesMerged += 1;
    const target = categories[matchIndex]!;

    for (const importedItem of importedCategory.items) {
      const existingItem = target.items.find(
        (item) => normalizeName(item.name) === normalizeName(importedItem.name),
      );

      if (!existingItem) {
        target.items.unshift(
          createGearItem({
            name: importedItem.name,
            category: target.id,
            status: importedItem.status,
            weight_lbs: importedItem.weight_lbs,
            storageLocation: importedItem.storageLocation,
          }),
        );
        itemsAdded += 1;
        continue;
      }

      const nextWeight =
        importedItem.weight_lbs != null ? importedItem.weight_lbs : existingItem.weight_lbs;
      const nextStorage = importedItem.storageLocation ?? existingItem.storageLocation;

      const changed =
        existingItem.weight_lbs !== nextWeight ||
        existingItem.storageLocation !== nextStorage;

      if (changed) {
        existingItem.weight_lbs = nextWeight;
        existingItem.storageLocation = nextStorage;
        itemsUpdated += 1;
      }
    }
  }

  return {
    categories,
    categoriesAdded,
    categoriesMerged,
    itemsAdded,
    itemsUpdated,
    mealsAdded: 0,
    mealsUpdated: 0,
  };
}

export function mergeImportedMealItems(
  existing: MealPrepDay[] | undefined,
  imported: MealImportItem[],
): {
  mealPrepDays: MealPrepDay[];
  mealsAdded: number;
  mealsUpdated: number;
} {
  let mealPrepDays = [...(existing ?? [])];
  let mealsAdded = 0;
  let mealsUpdated = 0;

  for (const importedItem of imported) {
    const day = mealPrepDays.find((entry) => entry.dayNumber === importedItem.dayNumber);
    const items = day ? [...day.items] : [];
    const match = items.find(
      (item) => normalizeName(item.title) === normalizeName(importedItem.title),
    );

    if (!match) {
      const next: MealPrepItem = createMealPrepItem({
        title: importedItem.title,
        status: importedItem.status,
        recipeNotes: importedItem.recipeNotes,
      });
      items.push(next);
      mealPrepDays = upsertMealPrepDayItems(mealPrepDays, importedItem.dayNumber, items);
      mealsAdded += 1;
      continue;
    }

    let changed = false;
    if (match.status !== importedItem.status) {
      match.status = importedItem.status;
      changed = true;
    }

    const nextNotes = importedItem.recipeNotes?.trim() || undefined;
    const currentNotes = match.recipeNotes?.trim() || undefined;
    if (nextNotes !== currentNotes) {
      if (nextNotes) {
        match.recipeNotes = nextNotes;
      } else {
        delete match.recipeNotes;
      }
      changed = true;
    }

    if (changed) {
      mealsUpdated += 1;
      mealPrepDays = upsertMealPrepDayItems(mealPrepDays, importedItem.dayNumber, items);
    }
  }

  return { mealPrepDays, mealsAdded, mealsUpdated };
}

export function formatImportMergeSummary(result: ImportMergeResult): string {
  const parts: string[] = [];

  if (result.categoriesAdded > 0) {
    parts.push(
      `${result.categoriesAdded} categor${result.categoriesAdded === 1 ? "y" : "ies"} added`,
    );
  }
  if (result.itemsAdded > 0) {
    parts.push(`${result.itemsAdded} item${result.itemsAdded === 1 ? "" : "s"} added`);
  }
  if (result.itemsUpdated > 0) {
    parts.push(`${result.itemsUpdated} item${result.itemsUpdated === 1 ? "" : "s"} updated`);
  }
  if (result.mealsAdded > 0) {
    parts.push(`${result.mealsAdded} meal${result.mealsAdded === 1 ? "" : "s"} added`);
  }
  if (result.mealsUpdated > 0) {
    parts.push(
      `${result.mealsUpdated} meal${result.mealsUpdated === 1 ? "" : "s"} updated`,
    );
  }
  if (
    result.categoriesMerged > 0 &&
    result.itemsAdded === 0 &&
    result.itemsUpdated === 0 &&
    result.mealsAdded === 0 &&
    result.mealsUpdated === 0
  ) {
    parts.push("existing checklist already up to date");
  }

  return parts.length > 0 ? parts.join(", ") : "Import complete";
}

export function isChecklistExportDocument(value: unknown): value is ChecklistExportDocument {
  return (
    isRecord(value) &&
    value.version === CHECKLIST_EXPORT_VERSION &&
    isAcceptedChecklistExportFormat(value.format) &&
    Array.isArray(value.categories)
  );
}
