import { forwardRef, type ReactNode } from "react";

interface FabProps {
  label: string;
  text?: string;
  onClick: () => void;
  children: ReactNode;
  armed?: boolean;
  className?: string;
}

export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { label, text, onClick, children, armed = false, className = "" },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={armed ? "Confirm reset all items" : label}
      title={armed ? "Tap again to confirm" : label}
      className={`fab-button absolute z-30 flex h-14 -translate-y-2 items-center justify-center gap-2 rounded-full px-4 shadow-lg ring-4 ring-background active:scale-95 ${
        armed
          ? "bg-red-600 text-white"
          : "bg-accent text-accent-foreground"
      } ${className}`}
      style={{
        right: "max(0.75rem, var(--safe-area-right))",
        bottom: "100%",
        marginBottom: "0.75rem",
      }}
    >
      {children}
      {text ? <span className="text-sm font-bold">{text}</span> : null}
    </button>
  );
});
