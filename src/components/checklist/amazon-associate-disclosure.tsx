import { isAmazonAffiliateEnabled } from "@/lib/affiliate-config";

import {
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_ASSOCIATE_USAGE_NOTE,
} from "@/lib/affiliate-links";

const SHOPPING_LINK_NOTE =
  "Eligible gear items may show a shopping cart icon that opens Amazon search results in your browser.";

export function AmazonAssociateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-snug text-muted ${className}`.trim()}
    >
      {isAmazonAffiliateEnabled()
        ? `${AMAZON_ASSOCIATE_DISCLOSURE} ${AMAZON_ASSOCIATE_USAGE_NOTE}`
        : SHOPPING_LINK_NOTE}
    </p>
  );
}
