import { useEffect, useReducer } from "react";

// How many font loads the page has finished. A width a canvas measured before a load finished may be the fallback's.
let loads = 0;
let counting = false;

/** How many font loads the page has finished, as a key for widths measured on a canvas. */
export function fontLoads(): number {
  if (!counting && typeof document !== "undefined" && document.fonts) {
    counting = true;
    document.fonts.addEventListener("loadingdone", () => loads++);
  }
  return loads;
}

/**
 * Renders the component again each time the page finishes loading fonts, so text measured on a canvas is measured in
 * the face it is drawn in. The load may start after the component mounts, set off by its own text, and may be any
 * face: a subset for other characters, or another family.
 */
export function useRenderWhenFontsLoad(): void {
  const seen = fontLoads();
  const [, render] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (!document.fonts) return;
    // A load that finished between this render and now is caught here; later ones by the listener.
    if (fontLoads() !== seen) render();
    document.fonts.addEventListener("loadingdone", render);
    return () => document.fonts.removeEventListener("loadingdone", render);
  }, [seen]);
}
