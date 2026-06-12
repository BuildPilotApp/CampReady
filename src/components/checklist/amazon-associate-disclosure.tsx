import { AMAZON_ASSOCIATE_DISCLOSURE } from "@/lib/affiliate-links";

export function AmazonAssociateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[0.65rem] leading-snug text-muted ${className}`.trim()}
    >
      {AMAZON_ASSOCIATE_DISCLOSURE}
    </p>
  );
}
