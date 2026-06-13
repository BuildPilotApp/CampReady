"use client";

import {
  scrollElementIntoKeyboardView,
  watchKeyboardViewportForElement,
} from "@/lib/scroll-into-keyboard-view";
import { useCallback, useRef } from "react";
import type { FocusEvent } from "react";

export function useKeyboardAwareScroll() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const onFocus = useCallback((event: FocusEvent<HTMLElement>) => {
    cleanupRef.current?.();
    const element = event.currentTarget;
    scrollElementIntoKeyboardView(element);
    cleanupRef.current = watchKeyboardViewportForElement(element);
  }, []);

  const onBlur = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  return { onFocus, onBlur };
}
