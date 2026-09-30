type ScrollIntoKeyboardViewOptions = {
  behavior?: ScrollBehavior;
  padding?: number;
};

export type KeyboardScrollMeasurement = {
  rectTop: number;
  rectBottom: number;
  viewportHeight: number;
  offsetTop: number;
  padding?: number;
};

const DEFAULT_PADDING = 16;
const SETTLE_MS = 80;

/**
 * Scroll delta that brings a focused field into the visible band.
 * A non-zero visualViewport offset means iOS already panned for the keyboard,
 * so the window must stay put or WebKit paints both positions.
 * Coordinates are visual-viewport relative (getBoundingClientRect).
 */
export function keyboardScrollDelta(measurement: KeyboardScrollMeasurement): number {
  if (measurement.offsetTop !== 0) {
    return 0;
  }

  const padding = measurement.padding ?? DEFAULT_PADDING;
  const visibleBottom = measurement.viewportHeight - padding;
  if (visibleBottom <= padding) {
    return 0;
  }

  if (measurement.rectTop < padding) {
    return measurement.rectTop - padding;
  }

  if (measurement.rectBottom > visibleBottom) {
    return measurement.rectBottom - visibleBottom;
  }

  return 0;
}

export function scrollElementIntoKeyboardView(
  element: HTMLElement,
  options?: ScrollIntoKeyboardViewOptions,
): void {
  const behavior = options?.behavior ?? "auto";
  const padding = options?.padding ?? DEFAULT_PADDING;
  const visualViewport = window.visualViewport;
  const rect = element.getBoundingClientRect();
  const delta = keyboardScrollDelta({
    rectTop: rect.top,
    rectBottom: rect.bottom,
    viewportHeight: visualViewport?.height ?? window.innerHeight,
    offsetTop: visualViewport?.offsetTop ?? 0,
    padding,
  });

  if (Math.abs(delta) > 2) {
    window.scrollBy({ top: delta, behavior });
  }
}

export function watchKeyboardViewportForElement(
  element: HTMLElement,
  options?: Pick<ScrollIntoKeyboardViewOptions, "padding">,
): () => void {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return () => {};
  }

  const padding = options?.padding ?? DEFAULT_PADDING;
  let settleTimer = 0;
  const align = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      scrollElementIntoKeyboardView(element, { behavior: "auto", padding });
    }, SETTLE_MS);
  };

  visualViewport.addEventListener("resize", align);

  return () => {
    window.clearTimeout(settleTimer);
    visualViewport.removeEventListener("resize", align);
  };
}
