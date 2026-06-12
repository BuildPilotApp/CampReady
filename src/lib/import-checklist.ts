import { STATUS_LABELS } from "@/lib/gear-status";
import {
  CHECKLIST_EXPORT_FORMAT,
  CHECKLIST_EXPORT_VERSION,
  type ChecklistExportCategory,
  type ChecklistExportDocument,
} from "@/lib/checklist-export-format";
import { createCategory, createGearItem } from "@/lib/storage";
import type { Category, GearItemStatus } from "@/types";

const GEAR_STATUSES: GearItemStatus[] = ["missing", "staged", "packed"];

const STATUS_BY_LABEL: Record<string, GearItemStatus> = {
  [STATUS_LABELS.missing]: "missing",
  [STATUS_LABELS.staged]: "staged",
  [STATUS_LABELS.packed]: "packed",
  missing: "missing",
  staged: "staged",
  packed: "packed",
};

export interface ImportValidationError {
  path: string;
  message: string;
}

export interface ValidatedChecklistImport {
  categories: ChecklistExportCategory[];
  sourceFormat: "json" | "csv";
}

export interface ImportMergeResult {
  categories: Category[];
  categoriesAdded: number;
  categoriesMerged: number;
  itemsAdded: number;
  itemsUpdated: number;
}

export type ImportValidationResult =
  | { ok: true; data: ValidatedChecklistImport }
  | { ok: false; errors: ImportValidationError[] };

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStatus(value: unknown, path: string, errors: ImportValidationError[]): GearItemStatus | null {
  if (typeof value !== "string" || !value.trim()) {
    errors.push({ path, message: "Status must be a non-empty string." });
    return null;
  }

  const status = STATUS_BY_LABEL[value.trim()] ?? STATUS_BY_LABEL[value.trim().toLowerCase()];
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

  if (value.format !== CHECKLIST_EXPORT_FORMAT) {
    errors.push({
      path: "format",
      message: `Expected format "${CHECKLIST_EXPORT_FORMAT}".`,
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

  if (parsed.format === CHECKLIST_EXPORT_FORMAT || parsed.version === CHECKLIST_EXPORT_VERSION) {
    const categories = validateChecklistExportDocument(parsed, errors);
    return errors.length === 0 ? categories : null;
  }

  if (Array.isArray(parsed.categories)) {
    const categories = validateCategoriesArray(parsed.categories, errors);
    return errors.length === 0 ? categories : null;
  }

  return null;
}

function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
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

  return rows.filter((entry) => entry.some((cell) => cell.trim().length > 0));
}

const CSV_HEADERS = ["category", "item", "status", "weight (lbs)", "storage"];

function validateChecklistCsv(raw: string): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const rows = parseCsvRows(raw.trim());

  if (rows.length === 0) {
    return { ok: false, errors: [{ path: "csv", message: "CSV file is empty." }] };
  }

  const header = rows[0]!.map((cell) => cell.trim().toLowerCase());
  const headerMatches =
    header.length >= 3 &&
    header[0] === CSV_HEADERS[0] &&
    header[1] === CSV_HEADERS[1] &&
    header[2] === CSV_HEADERS[2];

  if (!headerMatches) {
    return {
      ok: false,
      errors: [
        {
          path: "csv.header",
          message: 'CSV must start with headers: Category, Item, Status, Weight (lbs), Storage.',
        },
      ],
    };
  }

  const categoryMap = new Map<string, ChecklistExportCategory>();

  rows.slice(1).forEach((row, rowIndex) => {
    const path = `csv.rows[${rowIndex + 1}]`;
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
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const categories = [...categoryMap.values()];
  if (categories.length === 0) {
    return {
      ok: false,
      errors: [{ path: "categories", message: "Import file contains no categories or items." }],
    };
  }

  return {
    ok: true,
    data: {
      sourceFormat: "csv",
      categories,
    },
  };
}

export function detectImportFormat(
  content: string,
  filename?: string,
): "json" | "csv" {
  const extension = filename?.split(".").pop()?.toLowerCase();
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
          'JSON must be a CampReady checklist export, a categories array, or an object with a "categories" array.',
      });
    }
    return { ok: false, errors };
  }

  if (categories.length === 0) {
    return {
      ok: false,
      errors: [{ path: "categories", message: "Import file contains no categories or items." }],
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
): ImportValidationResult {
  const format = detectImportFormat(content, filename);
  return format === "json"
    ? validateChecklistJson(content)
    : validateChecklistCsv(content);
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
  };
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
  if (result.categoriesMerged > 0 && result.itemsAdded === 0 && result.itemsUpdated === 0) {
    parts.push("existing checklist already up to date");
  }

  return parts.length > 0 ? parts.join(", ") : "Import complete";
}

export function isChecklistExportDocument(value: unknown): value is ChecklistExportDocument {
  return (
    isRecord(value) &&
    value.version === CHECKLIST_EXPORT_VERSION &&
    value.format === CHECKLIST_EXPORT_FORMAT &&
    Array.isArray(value.categories)
  );
}
