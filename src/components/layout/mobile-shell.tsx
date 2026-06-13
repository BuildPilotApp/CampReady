import type { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * Main app scaffold — fills the centered viewport frame from the root layout
 * with safe-area padding for one-handed use and outdoor readability.
 */
export function MobileShell({ children, header, footer }: MobileShellProps) {
  return (
    <div className="mobile-app-shell relative flex min-h-dvh flex-col bg-background text-foreground">
      {header ? (
        <header className="mobile-safe-x mobile-safe-top sticky top-0 z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
          {header}
        </header>
      ) : null}
      <main className="mobile-safe-x flex-1">
        {children}
      </main>
      {footer ? (
        <footer className="mobile-safe-x mobile-safe-bottom sticky bottom-0 z-10 shrink-0 bg-surface">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
