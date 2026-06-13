/**
 * Set to your Amazon Associates tracking ID when ready for production.
 * Shopping cart links still appear for eligible gear when this is null;
 * the tag is appended only when configured so commission tracking stays optional.
 */
export const AMAZON_AFFILIATE_TAG: string | null = null;

export function isAmazonAffiliateEnabled(): boolean {
  return (
    typeof AMAZON_AFFILIATE_TAG === "string" && AMAZON_AFFILIATE_TAG.trim().length > 0
  );
}
