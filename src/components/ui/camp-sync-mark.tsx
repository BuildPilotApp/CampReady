import type { SVGProps } from "react";

type CampSyncMarkProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  /** Accepted for LucideIcon drop-in compatibility; unused (filled mark). */
  strokeWidth?: number | string;
};

/**
 * Teepee brand mark matching the CampSync app icon silhouette.
 * Uses currentColor so it picks up text-accent / text-foreground like Lucide icons.
 */
export function CampSyncMark({
  className,
  size,
  strokeWidth: _strokeWidth,
  width,
  height,
  ...props
}: CampSyncMarkProps) {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width={resolvedWidth}
      height={resolvedHeight}
      aria-hidden
      {...props}
    >
      {/* Crossed poles */}
      <path d="M10.15 1.85 11.55 4.35 10.35 5.05 8.95 2.55z" />
      <path d="M13.85 1.85 15.05 2.55 13.65 5.05 12.45 4.35z" />
      {/* Teepee body with door cutout (evenodd) and flat base flaps */}
      <path
        fillRule="evenodd"
        d="M12 3.75 3.25 19.35h1.35L3.2 20.7H7.1L12 12.2l4.9 8.5h3.9l-1.4-1.35h1.35L12 3.75Zm0 10.1L9.55 19.35h4.9L12 13.85Z"
      />
    </svg>
  );
}
