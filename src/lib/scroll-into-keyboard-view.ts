type ScrollIntoKeyboardViewOptions = {
  behavior?: ScrollBehavior;
  padding?: number;
};

function getVisibleBand(padding: number): { top: number; bottom: number } | null {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return null;
  }

  return {
    top: visualViewport.offsetTop + padding,
    bottom: visualViewport.offsetTop + visualViewport.height - padding,
  };
}

export function scrollElementIntoKeyboardView(
  element: HTMLElement,
  options?: ScrollIntoKeyboardViewOptions,
): void {
  const behavior = options?.behavior ?? "smooth";
  const padding = options?.padding ?? 16;

  const align = () => {
    const band = getVisibleBand(padding);
    if (!band || band.bottom <= band.top) {
      element.scrollIntoView({ behavior, block: "center" });
      return;
    }

    const rect = element.getBoundingClientRect();
    const visibleMid = (band.top + band.bottom) / 2;
    const elementMid = rect.top + rect.height / 2;
    const delta = elementMid - visibleMid;

    if (Math.abs(delta) > 2) {
      window.scrollBy({ top: delta, behavior });
    }
  };

  align();
  requestAnimationFrame(align);
  window.setTimeout(align, 100);
  window.setTimeout(align, 350);
}

export function watchKeyboardViewportForElement(
  element: HTMLElement,
  options?: Pick<ScrollIntoKeyboardViewOptions, "padding">,
): () => void {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return () => {};
  }

  const padding = options?.padding ?? 16;
  const align = () => {
    scrollElementIntoKeyboardView(element, { behavior: "auto", padding });
  };

  visualViewport.addEventListener("resize", align);
  visualViewport.addEventListener("scroll", align);
  align();

  return () => {
    visualViewport.removeEventListener("resize", align);
    visualViewport.removeEventListener("scroll", align);
  };
}
