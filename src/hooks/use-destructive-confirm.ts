"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDestructiveConfirm(onConfirm: () => void) {
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (ref.current?.contains(target)) {
        return;
      }
      setArmed(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [armed]);

  const handleClick = useCallback(() => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  }, [armed, onConfirm]);

  const disarm = useCallback(() => setArmed(false), []);

  return { armed, handleClick, disarm, ref };
}
