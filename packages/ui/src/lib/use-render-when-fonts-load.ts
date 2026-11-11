import { useEffect, useReducer, useRef } from "react";

// How many font loads the page has finished, on the font set it was counted on.
let loads = 0;
let counted: FontFaceSet | undefined;

/** How many font loads the page has finished: a width a canvas measured before the last one may be the fallback's. */
export function fontLoads(): number {
  if (typeof document !== "undefined" && document.fonts && document.fonts !== counted) {
    counted = document.fonts;
    counted.addEventListener("loadingdone", () => loads++);
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
  const latest = useRef(measure);
  const [, render] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    latest.current = measure;
  });
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const recheck = () => {
      if (latest.current() !== drawn) render();
    };
    // A load that finished between this render and now.
    recheck();
    fonts.addEventListener("loadingdone", recheck);
    return () => fonts.removeEventListener("loadingdone", recheck);
  }, [drawn]);
}
