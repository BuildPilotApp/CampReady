"use client";

import {
  getPowerPolicy,
  subscribePowerPolicy,
  type PowerPolicy,
} from "@/lib/runtime/app-power-mode";
import { useEffect, useState } from "react";

/** React subscription to the shared foreground / battery power policy. */
export function useAppPowerMode(): PowerPolicy {
  const [current, setCurrent] = useState<PowerPolicy>(() => getPowerPolicy());

  useEffect(() => subscribePowerPolicy(setCurrent), []);

  return current;
}
