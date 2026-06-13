import { isAmazonAffiliateEnabled } from "@/lib/affiliate-config";

import {
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_ASSOCIATE_USAGE_NOTE,
} from "@/lib/affiliate-links";

export function AmazonAssociateDisclosure({ className = "" }: { className?: string }) {
  if (!isAmazonAffiliateEnabled()) {
    return null;
  }
  return (
    <p
      className={`text-xs leading-snug text-muted ${className}`.trim()}
    >
      {AMAZON_ASSOCIATE_DISCLOSURE} {AMAZON_ASSOCIATE_USAGE_NOTE}
    </p>
  );
}
