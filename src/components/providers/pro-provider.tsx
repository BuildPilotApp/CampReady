"use client";

import { PaywallModal } from "@/components/premium/paywall-modal";
import { ProSuccessToast } from "@/components/premium/pro-success-toast";
import { readProStatus, setProStatus } from "@/lib/pro";
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

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setProStatus(true);
      setIsPro(true);
      setSuccessVisible(true);

      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
      return;
    }

    setIsPro(readProStatus());
  }, []);

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
