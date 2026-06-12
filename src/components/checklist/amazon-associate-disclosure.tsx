import {
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_ASSOCIATE_USAGE_NOTE,
} from "@/lib/affiliate-links";

export function AmazonAssociateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-snug text-muted ${className}`.trim()}
    >
      {AMAZON_ASSOCIATE_DISCLOSURE} {AMAZON_ASSOCIATE_USAGE_NOTE}
    </p>
  );
}
