"use client";

import { PaywallModal } from "@/components/premium/paywall-modal";
import { ProSuccessToast } from "@/components/premium/pro-success-toast";
import {
  canUseNativeGooglePlayBilling,
  restoreNativeCampReadyPro,
} from "@/lib/native-billing";
import {
  applyPrimeTestLabProBypassOnLaunch,
  hasProEntitlement,
  hasSeenProWelcome,
  isPrimeTestLabBypassActive,
  markProWelcomeSeen,
  readProStatus,
  unlockProLocally,
} from "@/lib/pro";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ProContextValue {
  isPro: boolean;
  isProEntitled: boolean;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  requirePro: (action: () => void) => void;
  refreshProAccess: () => { isPro: boolean };
  completeProPurchase: () => void;
}

const ProContext = createContext<ProContextValue | null>(null);

function syncProFromDevice(): boolean {
  applyPrimeTestLabProBypassOnLaunch();
  return readProStatus();
}

function readInitialProStatus(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  applyPrimeTestLabProBypassOnLaunch();
  return readProStatus();
}

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(readInitialProStatus);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const isProRef = useRef(isPro);
  isProRef.current = isPro;

  const celebrateProUnlock = useCallback((wasPro: boolean) => {
    if (wasPro || hasSeenProWelcome()) {
      return;
    }
    markProWelcomeSeen();
    setSuccessVisible(true);
  }, []);

  const completeProPurchase = useCallback(() => {
    const wasPro = isProRef.current;
    unlockProLocally();
    setIsPro(true);
    celebrateProUnlock(wasPro);
    setPaywallOpen(false);
  }, [celebrateProUnlock]);

  const refreshProState = useCallback(() => {
    const nextIsPro = syncProFromDevice();
    setIsPro(nextIsPro);
    return nextIsPro;
  }, []);

  useEffect(() => {
    refreshProState();

    const restorePlayPurchase = async (): Promise<boolean> => {
      if (isPrimeTestLabBypassActive() || !canUseNativeGooglePlayBilling()) {
        return false;
      }
      const restored = await restoreNativeCampReadyPro();
      if (restored) {
        setIsPro(true);
      }
      return restored;
    };

    // Capture entitlement before restore so a reinstall can celebrate once,
    // while already-Pro devices skip the toast on every successful owned check.
    const wasProOnMount = isProRef.current;
    void restorePlayPurchase().then((restored) => {
      if (restored) {
        celebrateProUnlock(wasProOnMount);
      }
    });

    const handleReturnToApp = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const wasPro = isProRef.current;
      void restorePlayPurchase().then((restored) => {
        if (restored) {
          setIsPro(true);
          celebrateProUnlock(wasPro);
          setPaywallOpen(false);
        } else {
          refreshProState();
        }
      });
    };

    window.addEventListener("focus", handleReturnToApp);
    window.addEventListener("pageshow", handleReturnToApp);
    document.addEventListener("visibilitychange", handleReturnToApp);

    return () => {
      window.removeEventListener("focus", handleReturnToApp);
      window.removeEventListener("pageshow", handleReturnToApp);
      document.removeEventListener("visibilitychange", handleReturnToApp);
    };
  }, [celebrateProUnlock, refreshProState]);

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
      if (hasProEntitlement(isPro)) {
        action();
        return;
      }
      openPaywall();
    },
    [isPro, openPaywall],
  );

  const refreshProAccess = useCallback(() => {
    const nextIsPro = refreshProState();
    return { isPro: nextIsPro };
  }, [refreshProState]);

  const value = useMemo<ProContextValue>(
    () => ({
      isPro,
      isProEntitled: hasProEntitlement(isPro),
      paywallOpen,
      openPaywall,
      closePaywall,
      requirePro,
      refreshProAccess,
      completeProPurchase,
    }),
    [
      isPro,
      paywallOpen,
      openPaywall,
      closePaywall,
      requirePro,
      refreshProAccess,
      completeProPurchase,
    ],
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
