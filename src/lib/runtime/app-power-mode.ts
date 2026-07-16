export type PowerPolicy = {
  isForeground: boolean;
  deferNonCriticalWrites: boolean;
  deferNetwork: boolean;
  debounceMultiplier: number;
};

const FOREGROUND_POLICY: PowerPolicy = {
  isForeground: true,
  deferNonCriticalWrites: false,
  deferNetwork: false,
  debounceMultiplier: 1,
};

let policy: PowerPolicy = { ...FOREGROUND_POLICY };
let initialized = false;
let lowBattery = false;
const listeners = new Set<(next: PowerPolicy) => void>();
const foregroundCallbacks = new Set<() => void>();

function isDocumentForeground(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState === "visible";
}

function computeDebounceMultiplier(isForeground: boolean, lowBattery: boolean): number {
  if (lowBattery) {
    return 3;
  }
  return isForeground ? 1 : 2;
}

function applyPolicy(next: PowerPolicy, notifyForeground = false): void {
  const wasBackground = !policy.isForeground;
  policy = next;
  for (const listener of listeners) {
    listener(policy);
  }
  if (notifyForeground && wasBackground && policy.isForeground) {
    for (const callback of foregroundCallbacks) {
      callback();
    }
  }
}

function refreshPolicy(options?: { lowBattery?: boolean; notifyForeground?: boolean }): void {
  const isForeground = isDocumentForeground();
  if (typeof options?.lowBattery === "boolean") {
    lowBattery = options.lowBattery;
  }
  applyPolicy(
    {
      isForeground,
      deferNonCriticalWrites: !isForeground,
      deferNetwork: !isForeground,
      debounceMultiplier: computeDebounceMultiplier(isForeground, lowBattery),
    },
    options?.notifyForeground ?? false,
  );
}

export function getPowerPolicy(): PowerPolicy {
  return policy;
}

export function subscribePowerPolicy(listener: (next: PowerPolicy) => void): () => void {
  listeners.add(listener);
  listener(policy);
  return () => {
    listeners.delete(listener);
  };
}

export function onReturnToForeground(callback: () => void): () => void {
  foregroundCallbacks.add(callback);
  return () => {
    foregroundCallbacks.delete(callback);
  };
}

/** Install visibility, native app-state, and battery listeners once. */
export function initAppPowerMode(): () => void {
  if (typeof window === "undefined" || initialized) {
    return () => {};
  }
  initialized = true;

  const handleVisibility = () => {
    refreshPolicy({ lowBattery, notifyForeground: true });
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("focus", handleVisibility);
  window.addEventListener("pageshow", handleVisibility);

  void import("@capacitor/app")
    .then(({ App }) =>
      App.addListener("appStateChange", ({ isActive }) => {
        applyPolicy(
          {
            isForeground: isActive,
            deferNonCriticalWrites: !isActive,
            deferNetwork: !isActive,
            debounceMultiplier: computeDebounceMultiplier(isActive, lowBattery),
          },
          isActive,
        );
      }),
    )
    .catch(() => {
      // Web/PWA builds without native shell can rely on visibility listeners.
    });

  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    void (
      navigator as Navigator & {
        getBattery?: () => Promise<{
          level: number;
          charging: boolean;
          addEventListener: (type: string, listener: () => void) => void;
        }>;
      }
    )
      .getBattery?.()
      .then((battery) => {
        const syncBattery = () => {
          lowBattery = battery.level < 0.2 && !battery.charging;
          refreshPolicy({ lowBattery });
        };
        battery.addEventListener("levelchange", syncBattery);
        battery.addEventListener("chargingchange", syncBattery);
        syncBattery();
      })
      .catch(() => {
        // Battery API unavailable, so keep default multiplier.
      });
  }

  refreshPolicy({ lowBattery });

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("focus", handleVisibility);
    window.removeEventListener("pageshow", handleVisibility);
    initialized = false;
  };
}
