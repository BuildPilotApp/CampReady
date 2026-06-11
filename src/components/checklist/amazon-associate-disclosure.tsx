import { AMAZON_ASSOCIATE_DISCLOSURE } from "@/lib/affiliate-links";

export function AmazonAssociateDisclosure() {
  return (
    <p className="px-1 text-[0.65rem] leading-snug text-muted">
      {AMAZON_ASSOCIATE_DISCLOSURE}
    </p>
  );
}
