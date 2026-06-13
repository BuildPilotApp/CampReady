/**
 * Set to your Amazon Associates tracking ID when ready for production.
 * Leave null to disable affiliate shopping links until the live tag is configured.
 */
export const AMAZON_AFFILIATE_TAG: string | null = null;

export function isAmazonAffiliateEnabled(): boolean {
  return (
    typeof AMAZON_AFFILIATE_TAG === "string" && AMAZON_AFFILIATE_TAG.trim().length > 0
  );
}
