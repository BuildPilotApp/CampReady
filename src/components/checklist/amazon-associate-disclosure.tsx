import { isAmazonAffiliateEnabled } from "@/lib/affiliate-config";
import { AMAZON_ASSOCIATE_DISCLOSURE } from "@/lib/affiliate-links";

export function AmazonAssociateDisclosure({ className = "" }: { className?: string }) {
  if (!isAmazonAffiliateEnabled()) {
    return null;
  }

  return (
    <p className={`text-xs leading-snug text-muted ${className}`.trim()}>
      {AMAZON_ASSOCIATE_DISCLOSURE}
    </p>
  );
}
