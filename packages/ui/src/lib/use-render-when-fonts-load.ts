import { useLayoutEffect, useReducer, useRef } from "react";

// How many font loads the page has finished, and the font sets counting them.
let loads = 0;
const counted = new WeakSet<FontFaceSet>();

/** How many font loads the page has finished: a width a canvas measured before the last one may be the fallback's. */
export function fontLoads(): number {
  if (typeof document !== "undefined" && document.fonts && !counted.has(document.fonts)) {
    counted.add(document.fonts);
    document.fonts.addEventListener("loadingdone", () => loads++);
  }
  return loads;
}

/**
 * Renders the component again when a font load changes what `measure` returns: the width of the component's own
 * text, measured on a canvas. Any face may change it, whenever it loads: Geist after the fallback, a subset for other
 * characters, another family. A load that changes nothing the component measures leaves it alone, as Recharts redraws
 * a chart's marks on every render and their fade-in would play again.
 */
export function useRenderWhenFontsLoad(measure: () => number | string): void {
  const drawn = measure();
  const seen = fontLoads();
  const committed = useRef({ measure, drawn });
  const [, render] = useReducer((count: number) => count + 1, 0);
  // Layout effects run as the render commits, before any font event can: a load then sees this render's text.
  useLayoutEffect(() => {
    committed.current = { measure, drawn };
    // A load that finished between the render and its commit.
    if (fontLoads() !== seen && measure() !== drawn) render();
  }, [measure, drawn, seen]);
  useLayoutEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const recheck = () => {
      if (committed.current.measure() !== committed.current.drawn) render();
    };
    fonts.addEventListener("loadingdone", recheck);
    return () => fonts.removeEventListener("loadingdone", recheck);
  }, []);
}
