/** Structural categories for affiliate-eligible checklist items. */
export type AffiliateItemCategory = "gear" | "vehicle" | "galley" | "replenishable";

export type AffiliateSearchPrefix = "camping" | "outdoor" | "overland";

// ---------------------------------------------------------------------------
// Source keyword sets — grouped by shopping domain for maintainability.
// Each keyword is assigned to exactly one structural category below.
// ---------------------------------------------------------------------------

/** Camping & hiking: shelter, sleep, carry, and campsite setup. */
export const CAMPING_HIKING_KEYWORDS = [
  "Tent",
  "Sleeping Bag",
  "Sleeping Pad",
  "Air Mattress",
  "Cot",
  "Pillow",
  "Backpack",
  "Daypack",
  "Hydration Pack",
  "Trekking Pole",
  "Trekking Poles",
  "Hiking Pole",
  "Hiking Poles",
  "Hammock",
  "Tarp",
  "Ground Cloth",
  "Footprint",
  "Rain Fly",
  "Tent Stake",
  "Ground Stake",
  "Stake",
  "Paracord",
  "Guyline",
  "Cordage",
  "Camp Table",
  "Folding Table",
  "Camp Chair",
  "Folding Chair",
  "Camp Sink",
  "Portable Sink",
  "Water Jug",
  "Water Container",
  "Bivy",
  "Headlamp",
  "Flashlight",
  "Lantern",
  "GPS",
  "InReach",
  "Satellite Messenger",
  "Satellite",
  "Shovel",
  "Entrenchment Tool",
  "Dry Bag",
  "Stuff Sack",
  "Compression Sack",
  "Sleeping Bag Liner",
  "Camp Rug",
  "Portable Shower",
] as const;

/** Outdoor & off-grid: power, water, navigation, and communications. */
export const OUTDOOR_OFFGRID_KEYWORDS = [
  "Solar Panel",
  "Solar",
  "Power Station",
  "Portable Power",
  "Generator",
  "Power Bank",
  "Battery Bank",
  "Inverter",
  "Water Filter",
  "Filtration",
  "Purification",
  "Purifier",
  "Compass",
  "Binoculars",
  "Monocular",
  "Radio",
  "Walkie Talkie",
  "Ham Radio",
  "10 Meter",
  "CB Radio",
  "CB",
  "Fire Pit",
  "Portable Fire Pit",
  "Firewood",
  "Log",
  "GMRS",
  "FRS",
  "LTE",
  "WiFi",
  "Wi-Fi",
  "Range Extender",
  "Signal Booster",
  "Antenna",
  "5W",
  "8W",
  "Starlink",
  "Hand Crank Radio",
  "Weather Radio",
] as const;

/** Off-roading & vehicle: recovery, storage, lighting, and trail-side mods. */
export const OFFROAD_VEHICLE_KEYWORDS = [
  "Recovery Board",
  "Traction Board",
  "Maxtrax",
  "Recovery Tracks",
  "Gas Can",
  "Fuel Can",
  "Jerry Can",
  "Winch",
  "Winch Kit",
  "Recovery Strap",
  "Tow Strap",
  "Kinetic Rope",
  "Kinetic Strap",
  "Shackle",
  "Soft Shackle",
  "D-Ring",
  "Tire Deflator",
  "Deflator",
  "Air Down Tool",
  "Compressor",
  "Air Compressor",
  "Tire Inflator",
  "Hi-Lift Jack",
  "Bottle Jack",
  "Scissor Jack",
  "Jack",
  "Tool Kit",
  "Recovery Kit",
  "Repair Kit",
  "Jumper Cables",
  "Jump Starter",
  "Booster Cables",
  "Tie Down",
  "Tie-Down",
  "Ratchet Strap",
  "Cam Strap",
  "Canopy",
  "Bed Canopy",
  "Awning",
  "Rooftop Awning",
  "Vehicle Awning",
  "Cargo Box",
  "Roof Box",
  "Roof Basket",
  "Roof Rack",
  "Flood Light",
  "Floodlight",
  "LED Light Bar",
  "Light Bar",
  "Baja Designs",
  "Spare Tire",
  "Spare Wheel",
  "Recovery Gear",
  "MOLLE Panel",
  "MOLLE",
  "Storage Box",
  "Drawer System",
  "Truck Bed Storage",
  "12V Plug",
  "Cigarette Lighter Plug",
  "Power Plug",
  "Cable Tie",
  "Zip Tie",
  "Tie Wrap",
  "Rock Light",
  "Rock Lights",
  "Rock Slider",
  "Rock Sliders",
  "Side Steps",
  "Pet Cover",
  "Seat Cover",
  "Dog Cover",
  "Snatch Block",
  "Tree Saver",
  "Skid Plate",
  "Bash Plate",
  "Bull Bar",
  "Brush Guard",
  "Tire Repair Kit",
  "Plug Kit",
  "Wheel Chock",
  "Wheel Chocks",
  "Fender Flare",
  "Air Locker",
  "Diff Lock",
  "Bungee Cord",
  "Bungee",
  "Duct Tape",
] as const;

/** Food & cooking: galley gear and camp kitchen essentials. */
export const FOOD_COOKING_KEYWORDS = [
  "Camp Stove",
  "Backpacking Stove",
  "Stove",
  "Skillet",
  "Cast Iron",
  "Cook Pot",
  "Cooking Pot",
  "Pot",
  "Frying Pan",
  "Pan",
  "Cooler",
  "Ice Cooler",
  "Fridge",
  "Fridge Freezer",
  "Portable Fridge",
  "12V Fridge",
  "Freezer",
  "Ice Chest",
  "Utensils",
  "Flatware",
  "Cutlery",
  "Plate",
  "Bowl",
  "Cup",
  "Mug",
  "Tumbler",
  "Coffee Maker",
  "Percolator",
  "French Press",
  "Cutting Board",
  "Can Opener",
  "Bottle Opener",
  "Spatula",
  "Tongs",
  "Spork",
  "Spoon",
  "Fork",
  "Kettle",
  "Dutch Oven",
  "Griddle",
  "Colander",
  "Cooler Bag",
  "Tablecloth",
  "Towel",
  "Heater",
  "Camp Kitchen",
] as const;

/** Survival & safety: emergency tools and signaling gear. */
export const SURVIVAL_KEYWORDS = [
  "First Aid Kit",
  "First Aid",
  "Med Kit",
  "Emergency Blanket",
  "Space Blanket",
  "Mylar Blanket",
  "Fixed Blade",
  "Folding Knife",
  "Knife",
  "Multi-Tool",
  "Multitool",
  "Leatherman",
  "Axe",
  "Hatchet",
  "Tomahawk",
  "Pocket Chainsaw",
  "Bow Saw",
  "Saw",
  "Fire Starter",
  "Ferro Rod",
  "Firesteel",
  "Firestarter",
  "Whistle",
  "Emergency Whistle",
  "Signal Mirror",
  "Bear Spray",
  "Pepper Spray",
  "Emergency Beacon",
  "Flare",
] as const;

/** Skin care, hygiene, and personal camp comfort. */
export const SKINCARE_PERSONAL_KEYWORDS = [
  "Sunscreen",
  "Sun Block",
  "SPF",
  "Bug Spray",
  "Insect Repellent",
  "Repellent",
  "DEET",
  "Picaridin",
  "Lip Balm",
  "Chapstick",
  "Lotion",
  "Moisturizer",
  "Wet Wipe",
  "Wipes",
  "Baby Wipes",
  "Biodegradable Soap",
  "Camp Soap",
  "Hand Sanitizer",
  "Sanitizer",
  "Trowel",
  "Camp Trowel",
  "Cathole Trowel",
  "Mosquito Net",
  "Mosquito",
  "Tick Remover",
  "Tick Key",
  "Aloe Vera",
  "Aloe",
  "Toothpaste",
  "Toothbrush",
  "Camp Toilet",
  "Portable Toilet",
  "Folding Toilet",
  "Wag Bag",
  "Deodorant",
  "Toilet Paper",
  "Paper Towels",
  "Trash Bags",
  "Propane",
  "Fuel",
  "Fuel Canister",
  "Isobutane",
  "Lighter",
  "Matches",
  "Kindling",
  "Charcoal",
  "Coffee",
  "Isolates",
  "Blanket",
] as const;

/** Clothing & footwear for trail and camp conditions. */
export const CLOTHING_FOOTWEAR_KEYWORDS = [
  "Hiking Boots",
  "Hiking Boot",
  "Trail Runners",
  "Hiking Shoes",
  "Hiking Socks",
  "Wool Socks",
  "Rain Jacket",
  "Raincoat",
  "Waterproof Jacket",
  "Rain Poncho",
  "Poncho",
  "Fleece Jacket",
  "Fleece",
  "Base Layer",
  "Long Underwear",
  "Thermal",
  "Glove Liners",
  "Gloves",
  "Sun Hat",
  "Wide Brim Hat",
  "Beanie",
  "Knit Cap",
  "Winter Hat",
  "Sunglasses",
  "Polarized Glasses",
  "Gaiters",
  "GORE-TEX",
  "Goretex",
  "Boots",
  "Socks",
  "Shoes",
  "Hat",
] as const;

/** Shade, seating, and campsite comfort. */
export const SHADE_COMFORT_KEYWORDS = [
  "Instant Canopy",
  "Shade Awning",
  "Umbrella",
  "Beach Umbrella",
  "Screen Room",
  "Screen Tent",
  "Screen House",
  "Outdoor Mat",
  "Campsite Mat",
  "Chair",
  "Table",
  "Mat",
] as const;

/** Tools, electrical, and trail-side repair. */
export const TOOLS_KEYWORDS = [
  "Adjustable Wrench",
  "Wrench",
  "Socket Set",
  "Socket Wrench",
  "Socket",
  "Impact Driver",
  "Impact Wrench",
  "Impact",
  "Cordless Drill",
  "Drill",
  "Battery Charger",
  "Charger",
  "12V Battery",
  "Screwdriver",
  "Driver Bit",
  "Driver",
  "Multimeter",
  "12V",
  "18V",
  "20V",
  "Fuse Box",
  "Fuse",
  "Fuses",
  "Outlet",
  "Adapter",
  "Epoxy",
  "Glue",
  "Adhesive",
  "RTV Silicone",
  "Silicone",
  "Wire Harness",
  "Wiring",
  "Wire",
  "Rocker Switch",
  "Toggle Switch",
  "Switch",
  "Heat Gun",
  "WD-40",
  "Penetrant",
  "PB Blaster",
  "Dead Blow",
  "Mallet",
  "Hammer",
  "Screw Extractor",
  "Extractor",
  "Drill Bit",
  "Bits",
  "Crimp",
  "Crimper",
  "Soldering Iron",
  "Solder",
  "Breaker Bar",
  "Battery Isolator",
  "Isolator",
  "Fire Extinguisher",
  "LED Work Light",
  "Work Light",
  "Tool Bag",
  "Tool Roll",
  "Pliers",
  "Vise Grip",
  "Pry Bar",
  "Crowbar",
  "Strap",
  "Filter",
  "Batteries",
  "Battery",
  "Plug",
] as const;

// ---------------------------------------------------------------------------
// Structural keyword arrays — composed from domain sets above.
// ---------------------------------------------------------------------------

/** High-ticket camping and adventure gear. */
export const AFFILIATE_GEAR_KEYWORDS = [
  ...CAMPING_HIKING_KEYWORDS,
  ...OUTDOOR_OFFGRID_KEYWORDS,
  ...SURVIVAL_KEYWORDS,
  ...CLOTHING_FOOTWEAR_KEYWORDS,
  ...SHADE_COMFORT_KEYWORDS,
] as const;

/** Overlanding, recovery, and trail-side tools (high conversion). */
export const VEHICLE_RECOVERY_KEYWORDS = [
  ...OFFROAD_VEHICLE_KEYWORDS,
  ...TOOLS_KEYWORDS,
] as const;

/** Galley, kitchen, and basecamp comfort items. */
export const GALLEY_KEYWORDS = [...FOOD_COOKING_KEYWORDS] as const;

/** Consumables and restock items mapped to high-intent search queries. */
export const REPLENISHABLE_KEYWORDS = [...SKINCARE_PERSONAL_KEYWORDS] as const;

/** Personal items that must never show affiliate links. */
export const AFFILIATE_BLOCKLIST_KEYWORDS = [
  "Medication",
  "Prescription",
  "Underwear",
  "License",
  "Passport",
  "Clothes",
  "Wallet",
  "Pants",
  "Phone",
  "Keys",
  "Cash",
  "Credit Card",
  "ID Card",
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

const OUTDOOR_GEAR_KEYWORDS = new Set<string>([
  ...OUTDOOR_OFFGRID_KEYWORDS,
  "Solar",
  "Generator",
  "Binoculars",
  "Radio",
  "Antenna",
  "Compass",
  "Filter",
]);

const GALLEY_OUTDOOR_KEYWORDS = new Set<string>([
  "Tablecloth",
  "Towel",
  "Heater",
]);

interface AffiliateKeywordEntry {
  keyword: string;
  category: AffiliateItemCategory;
  searchPrefix?: AffiliateSearchPrefix;
}

const AFFILIATE_KEYWORD_ENTRIES: AffiliateKeywordEntry[] = [
  ...AFFILIATE_GEAR_KEYWORDS.map((keyword) => ({
    keyword,
    category: "gear" as const,
    searchPrefix: OUTDOOR_GEAR_KEYWORDS.has(keyword)
      ? ("outdoor" as const)
      : ("camping" as const),
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
    .replace(/[^\w\s-]/g, " ")
    .replace(/-/g, " ")
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary match for single-token keywords (avoids "log" in "catalog"). */
function matchesWordBoundary(normalizedItemName: string, token: string): boolean {
  if (!token) {
    return false;
  }
  const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`);
  return pattern.test(normalizedItemName);
}

function includesWithPluralFallback(
  normalizedItemName: string,
  normalizedKeyword: string,
): boolean {
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

function itemNameIncludesKeyword(normalizedItemName: string, keyword: string): boolean {
  const normalizedKeyword = normalizeAffiliateItemName(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  // Multi-word phrases: substring match handles modifiers ("extra sleeping bag liner").
  if (normalizedKeyword.includes(" ")) {
    return includesWithPluralFallback(normalizedItemName, normalizedKeyword);
  }

  // Single tokens: word-boundary first, then plural-stripped fallback.
  if (matchesWordBoundary(normalizedItemName, normalizedKeyword)) {
    return true;
  }

  const fallbackItemName = normalizeAffiliateItemNameForFallback(normalizedItemName);
  if (
    fallbackItemName !== normalizedItemName &&
    matchesWordBoundary(fallbackItemName, normalizedKeyword)
  ) {
    return true;
  }

  const fallbackKeyword = normalizeAffiliateItemNameForFallback(normalizedKeyword);
  if (fallbackKeyword !== normalizedKeyword) {
    if (matchesWordBoundary(normalizedItemName, fallbackKeyword)) {
      return true;
    }
    if (
      fallbackItemName !== normalizedItemName &&
      matchesWordBoundary(fallbackItemName, fallbackKeyword)
    ) {
      return true;
    }
  }

  // Last resort for short alphanumeric roots (e.g. "12v", "5w", "cb").
  if (normalizedKeyword.length <= 4) {
    return includesWithPluralFallback(normalizedItemName, normalizedKeyword);
  }

  return false;
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
    normalizedItemName.includes("insect repellent") ||
    normalizedItemName.includes("repellent") ||
    normalizedItemName.includes("deet") ||
    normalizedItemName.includes("picaridin") ||
    normalizedItemName.includes("mosquito")
  ) {
    return "camping bug spray";
  }
  if (normalizedItemName.includes("sunscreen") || normalizedItemName.includes("spf")) {
    return "sport sunscreen spf 50";
  }
  if (normalizedItemName.includes("lip balm") || normalizedItemName.includes("chapstick")) {
    return "camping lip balm spf";
  }
  if (normalizedItemName.includes("hand sanitizer") || normalizedItemName.includes("sanitizer")) {
    return "travel hand sanitizer";
  }
  if (
    normalizedItemName.includes("wet wipe") ||
    normalizedItemName.includes("wipes") ||
    normalizedItemName.includes("baby wipe")
  ) {
    return "camping biodegradable wipes";
  }
  if (normalizedItemName.includes("biodegradable soap") || normalizedItemName.includes("camp soap")) {
    return "camping biodegradable soap";
  }
  if (normalizedItemName.includes("toothpaste") || normalizedItemName.includes("toothbrush")) {
    return "travel camping toothpaste";
  }
  if (
    normalizedItemName.includes("camp toilet") ||
    normalizedItemName.includes("portable toilet") ||
    normalizedItemName.includes("wag bag")
  ) {
    return "portable camping toilet";
  }
  if (normalizedItemName.includes("trowel")) {
    return "camping trowel";
  }
  if (normalizedItemName.includes("tick")) {
    return "tick remover tool";
  }
  if (normalizedItemName.includes("aloe")) {
    return "aloe vera gel sun relief";
  }
  if (normalizedItemName.includes("lotion") || normalizedItemName.includes("moisturizer")) {
    return "camping moisturizer lotion";
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
  if (normalizedItemName.includes("isobutane")) {
    return "camping stove fuel canister";
  }
  if (normalizedItemName.includes("batteries")) {
    return "camping batteries pack";
  }
  if (normalizedItemName.includes("soap")) {
    return "camping biodegradable soap";
  }
  if (normalizedItemName.includes("matches")) {
    return "waterproof camping matches";
  }
  if (
    normalizedItemName.includes("fire starter") ||
    normalizedItemName.includes("firestarter") ||
    normalizedItemName.includes("ferro")
  ) {
    return "camping fire starter";
  }
  if (normalizedItemName.includes("lighter")) {
    return "waterproof camping lighter";
  }
  if (normalizedItemName.includes("kindling")) {
    return "camping fire kindling";
  }
  if (normalizedItemName.includes("charcoal")) {
    return "portable charcoal packs";
  }
  if (normalizedItemName.includes("deodorant")) {
    return "travel camping deodorant";
  }
  if (
    normalizedItemName.includes("first aid") ||
    normalizedItemName.includes("med kit")
  ) {
    return "camping first aid supplies";
  }
  if (normalizedItemName.includes("isolates")) {
    return "camping electrolyte drink mix";
  }
  if (normalizedItemName.includes("blanket")) {
    return "camping emergency blanket";
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
