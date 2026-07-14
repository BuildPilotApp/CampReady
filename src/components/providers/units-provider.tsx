"use client";

import {
  getStoredUnits,
  storeUnits,
  type AppUnits,
} from "@/lib/units";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface UnitsContextValue {
  units: AppUnits;
  setUnits: (units: AppUnits) => void;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnitsState] = useState<AppUnits>(() => getStoredUnits());

  const setUnits = useCallback((nextUnits: AppUnits) => {
    setUnitsState(nextUnits);
    storeUnits(nextUnits);
  }, []);

  const value = useMemo(
    () => ({
      units,
      setUnits,
    }),
    [units, setUnits],
  );

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
}

export function useUnits(): UnitsContextValue {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error("useUnits must be used within UnitsProvider");
  }
  return context;
}
