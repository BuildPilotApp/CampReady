"use client";

import { AlertCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "info" | "error";

interface ToastEntry {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface AppToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const AppToastContext = createContext<AppToastContextValue | null>(null);

const TOAST_DURATION_MS = 4500;

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AppToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-[var(--mobile-max-width)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-black/40 ${
                toast.variant === "error"
                  ? "border-red-500/40 bg-zinc-950"
                  : "border-border/60 bg-zinc-950"
              }`}
            >
              {toast.variant === "error" ? (
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <AlertCircle className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
              ) : null}
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-100">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-900 active:text-zinc-300"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </AppToastContext.Provider>
  );
}

export function useAppToast(): AppToastContextValue {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return context;
}
