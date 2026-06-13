"use client";

import { openExternalUrl } from "@/lib/open-external-url";
import { ExternalLink } from "lucide-react";

interface HostedLegalLinkProps {
  href: string;
  label: string;
}

export function HostedLegalLink({ href, label }: HostedLegalLinkProps) {
  const handleOpen = async () => {
    const result = await openExternalUrl(href);
    if (!result.ok) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleOpen()}
      className="touch-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-bold text-foreground active:bg-surface"
    >
      <ExternalLink className="size-4 shrink-0 text-accent" aria-hidden />
      {label}
    </button>
  );
}
