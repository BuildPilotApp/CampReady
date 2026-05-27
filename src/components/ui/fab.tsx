import type { ReactNode } from "react";

interface FabProps {
  label: string;
  text?: string;
  onClick: () => void;
  children: ReactNode;
}

export function Fab({ label, text, onClick, children }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute z-30 flex h-14 -translate-y-2 items-center justify-center gap-2 rounded-full bg-accent px-4 text-accent-foreground shadow-lg ring-4 ring-background active:scale-95"
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom: "100%",
        marginBottom: "0.75rem",
      }}
    >
      {children}
      {text ? <span className="text-sm font-bold">{text}</span> : null}
    </button>
  );
}
