/** Structural categories for affiliate-eligible checklist items. */
export type AffiliateItemCategory = "gear" | "replenishable" | "generic";

/** High-ticket camping gear keywords eligible for inline affiliate links. */
export const AFFILIATE_GEAR_KEYWORDS = [
  "First Aid Kit",
  "Sleeping Bag",
  "Air Mattress",
  "Water Filter",
  "Power Bank",
  "Headlamp",
  "Backpack",
  "Hammock",
  "Lantern",
  "Hatchet",
  "Cooler",
  "Heater",
  "Shovel",
  "Chair",
  "Table",
  "Stove",
  "Tarp",
  "Tent",
  "Axe",
  "Cot",
] as const;

/** Consumables and restock items that benefit from high-intent outdoor search terms. */
export const REPLENISHABLE_KEYWORDS = [
  "Insect Repellent",
  "Firestarter",
  "Trash Bags",
  "Batteries",
  "Propane",
  "Matches",
  "Coffee",
  "Charcoal",
  "Wipes",
  "Sunscreen",
  "Fuel",
  "Soap",
  "First Aid",
] as const;

/** Everyday camp kit items surfaced with a camping/outdoor search prefix. */
export const GENERIC_GEAR_KEYWORDS = [
  "Spoon",
  "Blanket",
  "Towel",
  "Plate",
  "Pillow",
  "Knife",
  "Mug",
  "Cup",
  "Pan",
  "Pot",
] as const;

export type AffiliateGearKeyword = (typeof AFFILIATE_GEAR_KEYWORDS)[number];
export type ReplenishableKeyword = (typeof REPLENISHABLE_KEYWORDS)[number];
export type GenericGearKeyword = (typeof GENERIC_GEAR_KEYWORDS)[number];

/** Replace with your Amazon Associates tracking ID. */
export const AMAZON_AFFILIATE_TAG = "YOUR_AMAZON_TAG_HERE";

interface AffiliateKeywordEntry {
  keyword: string;
  category: AffiliateItemCategory;
  /** Prepended to the item name for gear and generic matches. */
  searchPrefix?: "camping" | "outdoor";
}

const AFFILIATE_KEYWORD_ENTRIES: AffiliateKeywordEntry[] = [
  ...AFFILIATE_GEAR_KEYWORDS.map((keyword) => ({
    keyword,
    category: "gear" as const,
    searchPrefix: "camping" as const,
  })),
  ...REPLENISHABLE_KEYWORDS.map((keyword) => ({
    keyword,
    category: "replenishable" as const,
  })),
  ...GENERIC_GEAR_KEYWORDS.map((keyword) => ({
    keyword,
    category: "generic" as const,
    searchPrefix:
      keyword === "Towel" ? ("outdoor" as const) : ("camping" as const),
  })),
].sort((a, b) => b.keyword.length - a.keyword.length);

export interface AffiliateKeywordMatch {
  keyword: string;
  category: AffiliateItemCategory;
  searchPrefix?: "camping" | "outdoor";
}

/** Returns the matched keyword entry when `itemName` qualifies for an affiliate link. */
export function getAffiliateKeywordMatch(itemName: string): AffiliateKeywordMatch | null {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  for (const entry of AFFILIATE_KEYWORD_ENTRIES) {
    if (normalized.includes(entry.keyword.toLowerCase())) {
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
  if (normalizedItemName.includes("insect repellent")) {
    return "camping bug spray";
  }
  if (normalizedItemName.includes("trash bags")) {
    return "heavy duty outdoor trash bags";
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
  if (normalizedItemName.includes("sunscreen")) {
    return "sport sunscreen spf 50";
  }
  if (normalizedItemName.includes("charcoal")) {
    return "portable charcoal packs";
  }
  if (normalizedItemName.includes("first aid")) {
    return "camping first aid supplies";
  }

  return "camping essentials refill";
}

/** Builds a conversion-focused Amazon search query for a matched checklist item. */
export function buildAffiliateSearchQuery(itemName: string): string | null {
  const match = getAffiliateKeywordMatch(itemName);
  if (!match) {
    return null;
  }

  const trimmed = itemName.trim();
  const normalized = trimmed.toLowerCase();

  if (match.category === "replenishable") {
    return buildReplenishableSearchQuery(normalized);
  }

  const prefix = match.searchPrefix ?? "camping";
  return `${prefix} ${trimmed}`;
}

/** Amazon search affiliate URL for recognized gear items, or null when not eligible. */
export function buildAmazonAffiliateSearchUrl(itemName: string): string | null {
  const searchQuery = buildAffiliateSearchQuery(itemName);
  if (!searchQuery) {
    return null;
  }

  return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&tag=${AMAZON_AFFILIATE_TAG}`;
}
