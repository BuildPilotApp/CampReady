/** High-ticket camping gear keywords eligible for inline affiliate links. */
export const AFFILIATE_GEAR_KEYWORDS = [
  "First Aid Kit",
  "Sleeping Bag",
  "Water Filter",
  "Power Bank",
  "Headlamp",
  "Cooler",
  "Stove",
  "Tent",
] as const;

export type AffiliateGearKeyword = (typeof AFFILIATE_GEAR_KEYWORDS)[number];

/** Replace with your Amazon Associates tracking ID. */
export const AMAZON_AFFILIATE_TAG = "YOUR_AMAZON_TAG_HERE";

const KEYWORDS_BY_LENGTH = [...AFFILIATE_GEAR_KEYWORDS].sort(
  (a, b) => b.length - a.length,
);

/** Returns the matched keyword when `itemName` qualifies for an affiliate link. */
export function getAffiliateGearKeyword(itemName: string): AffiliateGearKeyword | null {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  for (const keyword of KEYWORDS_BY_LENGTH) {
    if (normalized.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  return null;
}

export function isAffiliateGearItem(itemName: string): boolean {
  return getAffiliateGearKeyword(itemName) !== null;
}

/** Amazon search affiliate URL for recognized gear items, or null when not eligible. */
export function buildAmazonAffiliateSearchUrl(itemName: string): string | null {
  if (!isAffiliateGearItem(itemName)) {
    return null;
  }

  const trimmed = itemName.trim();
  return `https://www.amazon.com/s?k=camping+${encodeURIComponent(trimmed)}&tag=${AMAZON_AFFILIATE_TAG}`;
}
