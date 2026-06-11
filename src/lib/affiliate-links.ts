/** Structural categories for affiliate-eligible checklist items. */
export type AffiliateItemCategory = "gear" | "vehicle" | "galley" | "replenishable";

export type AffiliateSearchPrefix = "camping" | "outdoor" | "overland";

/** High-ticket camping and adventure gear. */
export const AFFILIATE_GEAR_KEYWORDS = [
  "Sleeping Bag",
  "Air Mattress",
  "Sleeping Pad",
  "Power Bank",
  "Headlamp",
  "Flashlight",
  "Binoculars",
  "Backpack",
  "Generator",
  "Freezer",
  "Hammock",
  "Lantern",
  "Hatchet",
  "Cooler",
  "Fridge",
  "Heater",
  "InReach",
  "Satellite",
  "Shovel",
  "Filter",
  "Awning",
  "Solar",
  "Chair",
  "Table",
  "Stove",
  "Radio",
  "Tarp",
  "Tent",
  "GPS",
  "Axe",
  "Cot",
] as const;

/** Overlanding, recovery, and trail-side tools (high conversion). */
export const VEHICLE_RECOVERY_KEYWORDS = [
  "Fire Extinguisher",
  "Traction Board",
  "Ratchet Strap",
  "Repair Kit",
  "Tool Kit",
  "Compressor",
  "Deflator",
  "Maxtrax",
  "Shackle",
  "Bungee",
  "Duct Tape",
  "Zip Tie",
  "Winch",
  "Strap",
  "Wrench",
  "Socket",
  "Jack",
] as const;

/** Galley, kitchen, and basecamp comfort items. */
export const GALLEY_KEYWORDS = [
  "Bottle Opener",
  "Cutting Board",
  "Can Opener",
  "Tablecloth",
  "Spatula",
  "Skillet",
  "Blanket",
  "Spork",
  "Tongs",
  "Spoon",
  "Plate",
  "Pillow",
  "Knife",
  "Bowl",
  "Fork",
  "Mug",
  "Pan",
  "Pot",
  "Cup",
  "Foil",
  "Towel",
] as const;

/** Consumables and restock items mapped to high-intent search queries. */
export const REPLENISHABLE_KEYWORDS = [
  "Insect Repellent",
  "Paper Towels",
  "Firestarter",
  "Toothpaste",
  "Trash Bags",
  "Bug Spray",
  "Batteries",
  "Kindling",
  "Propane",
  "Deodorant",
  "Repellent",
  "Matches",
  "Sunscreen",
  "Isolates",
  "Charcoal",
  "Lighter",
  "Coffee",
  "Wipes",
  "Fuel",
  "Soap",
  "First Aid",
  "Med Kit",
  "Toilet Paper",
] as const;

/** Personal items that must never show affiliate links. */
export const AFFILIATE_BLOCKLIST_KEYWORDS = [
  "Medication",
  "Underwear",
  "License",
  "Clothes",
  "Wallet",
  "Pants",
  "Phone",
  "Socks",
  "Keys",
] as const;

/** @deprecated Use {@link GALLEY_KEYWORDS}. */
export const GENERIC_GEAR_KEYWORDS = GALLEY_KEYWORDS;

export type AffiliateGearKeyword = (typeof AFFILIATE_GEAR_KEYWORDS)[number];
export type VehicleRecoveryKeyword = (typeof VEHICLE_RECOVERY_KEYWORDS)[number];
export type GalleyKeyword = (typeof GALLEY_KEYWORDS)[number];
export type ReplenishableKeyword = (typeof REPLENISHABLE_KEYWORDS)[number];
/** @deprecated Use {@link GalleyKeyword}. */
export type GenericGearKeyword = GalleyKeyword;

/** Replace with your Amazon Associates tracking ID. */
export const AMAZON_AFFILIATE_TAG = "YOUR_AMAZON_TAG_HERE";

/** Exact phrasing required by Amazon Associates program policies. */
export const AMAZON_ASSOCIATE_DISCLOSURE =
  "As an Amazon Associate I earn from qualifying purchases.";

const GALLEY_OUTDOOR_KEYWORDS = new Set<GalleyKeyword>(["Blanket", "Tablecloth", "Towel"]);

interface AffiliateKeywordEntry {
  keyword: string;
  category: AffiliateItemCategory;
  searchPrefix?: AffiliateSearchPrefix;
}

const AFFILIATE_KEYWORD_ENTRIES: AffiliateKeywordEntry[] = [
  ...AFFILIATE_GEAR_KEYWORDS.map((keyword) => ({
    keyword,
    category: "gear" as const,
    searchPrefix: "camping" as const,
  })),
  ...VEHICLE_RECOVERY_KEYWORDS.map((keyword) => ({
    keyword,
    category: "vehicle" as const,
    searchPrefix: "overland" as const,
  })),
  ...GALLEY_KEYWORDS.map((keyword) => ({
    keyword,
    category: "galley" as const,
    searchPrefix: GALLEY_OUTDOOR_KEYWORDS.has(keyword)
      ? ("outdoor" as const)
      : ("camping" as const),
  })),
  ...REPLENISHABLE_KEYWORDS.map((keyword) => ({
    keyword,
    category: "replenishable" as const,
  })),
].sort((a, b) => b.keyword.length - a.keyword.length);

export interface AffiliateKeywordMatch {
  keyword: string;
  category: AffiliateItemCategory;
  searchPrefix?: AffiliateSearchPrefix;
}

/** Strips punctuation and collapses whitespace for reliable substring matching. */
export function normalizeAffiliateItemName(itemName: string): string {
  return itemName
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Safely removes trailing plural "s" from longer tokens to improve fallback matching
 * (e.g. "Tents" -> "tent", "Mugs" -> "mug") without touching words like "glass".
 */
export function normalizeAffiliateItemNameForFallback(itemName: string): string {
  return normalizeAffiliateItemName(itemName)
    .split(" ")
    .map((word) => {
      if (word.length <= 3 || !word.endsWith("s") || word.endsWith("ss")) {
        return word;
      }
      return word.slice(0, -1);
    })
    .join(" ");
}

function itemNameIncludesKeyword(normalizedItemName: string, keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase();

  if (normalizedItemName.includes(normalizedKeyword)) {
    return true;
  }

  const fallbackItemName = normalizeAffiliateItemNameForFallback(normalizedItemName);
  if (fallbackItemName !== normalizedItemName && fallbackItemName.includes(normalizedKeyword)) {
    return true;
  }

  const fallbackKeyword = normalizeAffiliateItemNameForFallback(normalizedKeyword);
  return (
    fallbackKeyword !== normalizedKeyword && normalizedItemName.includes(fallbackKeyword)
  );
}

export function isAffiliateBlockedItem(itemName: string): boolean {
  const normalized = normalizeAffiliateItemName(itemName);
  if (!normalized) {
    return false;
  }

  return AFFILIATE_BLOCKLIST_KEYWORDS.some((keyword) =>
    itemNameIncludesKeyword(normalized, keyword),
  );
}

/** Returns the matched keyword entry when `itemName` qualifies for an affiliate link. */
export function getAffiliateKeywordMatch(itemName: string): AffiliateKeywordMatch | null {
  const normalized = normalizeAffiliateItemName(itemName);
  if (!normalized) {
    return null;
  }

  if (isAffiliateBlockedItem(itemName)) {
    return null;
  }

  for (const entry of AFFILIATE_KEYWORD_ENTRIES) {
    if (itemNameIncludesKeyword(normalized, entry.keyword)) {
      return entry;
    }
  }

  return null;
}

/** @deprecated Prefer {@link getAffiliateKeywordMatch}. */
export function getAffiliateGearKeyword(itemName: string): string | null {
  return getAffiliateKeywordMatch(itemName)?.keyword ?? null;
}

export function isAffiliateGearItem(itemName: string): boolean {
  return getAffiliateKeywordMatch(itemName) !== null;
}

function buildReplenishableSearchQuery(normalizedItemName: string): string {
  if (
    normalizedItemName.includes("bug spray") ||
    normalizedItemName.includes("repellent")
  ) {
    return "camping bug spray";
  }
  if (normalizedItemName.includes("paper towels")) {
    return "camping paper towels bulk";
  }
  if (normalizedItemName.includes("trash bags")) {
    return "heavy duty outdoor trash bags";
  }
  if (normalizedItemName.includes("toilet paper")) {
    return "camping toilet paper";
  }
  if (normalizedItemName.includes("coffee")) {
    return "instant camping coffee packs";
  }
  if (normalizedItemName.includes("fuel") || normalizedItemName.includes("propane")) {
    return "camping fuel canister";
  }
  if (normalizedItemName.includes("batteries")) {
    return "camping batteries pack";
  }
  if (normalizedItemName.includes("wipes")) {
    return "camping biodegradable wipes";
  }
  if (normalizedItemName.includes("soap")) {
    return "camping biodegradable soap";
  }
  if (normalizedItemName.includes("matches")) {
    return "waterproof camping matches";
  }
  if (normalizedItemName.includes("firestarter")) {
    return "camping fire starter";
  }
  if (normalizedItemName.includes("lighter")) {
    return "waterproof camping lighter";
  }
  if (normalizedItemName.includes("kindling")) {
    return "camping fire kindling";
  }
  if (normalizedItemName.includes("sunscreen")) {
    return "sport sunscreen spf 50";
  }
  if (normalizedItemName.includes("charcoal")) {
    return "portable charcoal packs";
  }
  if (normalizedItemName.includes("toothpaste")) {
    return "travel camping toothpaste";
  }
  if (normalizedItemName.includes("deodorant")) {
    return "travel camping deodorant";
  }
  if (normalizedItemName.includes("first aid") || normalizedItemName.includes("med kit")) {
    return "camping first aid supplies";
  }
  if (normalizedItemName.includes("isolates")) {
    return "camping electrolyte drink mix";
  }

  return "camping essentials refill";
}

function cleanAffiliateSearchTerm(itemName: string): string {
  return itemName.trim().replace(/\s+/g, " ");
}

/** Builds a conversion-focused Amazon search query for a matched checklist item. */
export function buildAffiliateSearchQuery(itemName: string): string | null {
  const match = getAffiliateKeywordMatch(itemName);
  if (!match) {
    return null;
  }

  const cleanedItemName = cleanAffiliateSearchTerm(itemName);
  const normalized = normalizeAffiliateItemName(cleanedItemName);

  if (match.category === "replenishable") {
    return buildReplenishableSearchQuery(normalized);
  }

  const prefix = match.searchPrefix ?? "camping";
  return `${prefix} ${cleanedItemName}`;
}

/** Amazon search affiliate URL for recognized gear items, or null when not eligible. */
export function buildAmazonAffiliateSearchUrl(itemName: string): string | null {
  const searchQuery = buildAffiliateSearchQuery(itemName);
  if (!searchQuery) {
    return null;
  }

  return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&tag=${AMAZON_AFFILIATE_TAG}`;
}
