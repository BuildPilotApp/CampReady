"use client";

import { PaywallModal } from "@/components/premium/paywall-modal";
import { ProSuccessToast } from "@/components/premium/pro-success-toast";
import { readProStatus, tryActivateProFromCheckoutCallback } from "@/lib/pro";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ProContextValue {
  isPro: boolean;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  requirePro: (action: () => void) => void;
}

const ProContext = createContext<ProContextValue | null>(null);

function syncProFromDevice(): { activated: boolean; isPro: boolean } {
  const activated = tryActivateProFromCheckoutCallback();
  return { activated, isPro: readProStatus() };
}

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const refreshProState = useCallback((showSuccessOnActivate = false) => {
    const { activated, isPro: nextIsPro } = syncProFromDevice();
    setIsPro(nextIsPro);

    if (activated && showSuccessOnActivate) {
      setSuccessVisible(true);
      setPaywallOpen(false);
    }
  }, []);

  useEffect(() => {
    refreshProState(true);

    const handleReturnToApp = () => {
      if (document.visibilityState === "visible") {
        refreshProState(true);
      }
    };

    window.addEventListener("focus", handleReturnToApp);
    window.addEventListener("pageshow", handleReturnToApp);
    document.addEventListener("visibilitychange", handleReturnToApp);

    return () => {
      window.removeEventListener("focus", handleReturnToApp);
      window.removeEventListener("pageshow", handleReturnToApp);
      document.removeEventListener("visibilitychange", handleReturnToApp);
    };
  }, [refreshProState]);

  useEffect(() => {
    if (!successVisible) return;

    const timer = window.setTimeout(() => {
      setSuccessVisible(false);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [successVisible]);

  const openPaywall = useCallback(() => {
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
  }, []);

  const requirePro = useCallback(
    (action: () => void) => {
      if (isPro) {
        action();
        return;
      }
      openPaywall();
    },
    [isPro, openPaywall],
  );

  const value = useMemo<ProContextValue>(
    () => ({
      isPro,
      paywallOpen,
      openPaywall,
      closePaywall,
      requirePro,
    }),
    [isPro, paywallOpen, openPaywall, closePaywall, requirePro],
  );

  return (
    <ProContext.Provider value={value}>
      {children}
      {paywallOpen ? <PaywallModal onClose={closePaywall} /> : null}
      {successVisible ? (
        <ProSuccessToast onDismiss={() => setSuccessVisible(false)} />
      ) : null}
    </ProContext.Provider>
  );
}

export function usePro(): ProContextValue {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error("usePro must be used within ProProvider");
  }
  return context;
}
