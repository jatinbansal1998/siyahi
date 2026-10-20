// @ts-check
// A Vite plugin that preloads the Latin files of Geist and Geist Mono, the
// fonts nearly every Siyahi page draws first. Without it the browser asks for
// a font only once the page has rendered text in it, so on a slow network the
// fallback paints and Geist swaps in seconds later; with it the font
// downloads alongside the scripts and is usually there before the first paint.

// fontsource's file names, kept by Vite in each emitted asset's names. Geist's
// latin-ext file holds ₹, which the default locale prints on every amount.
const PRELOADED = new Set([
  "geist-latin-wght-normal.woff2",
  "geist-latin-ext-wght-normal.woff2",
  "geist-mono-latin-wght-normal.woff2",
]);

/** @returns {import("vite").Plugin} */
export function preloadFonts() {
  let base = "/";
  return {
    name: "siyahi:preload-fonts",
    // The dev server serves fonts from node_modules, where a preload has nothing to win.
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, { bundle }) {
        return Object.values(bundle ?? {})
          .filter((file) => file.type === "asset" && file.names.some((name) => PRELOADED.has(name)))
          .map((file) => ({
            tag: "link",
            attrs: { rel: "preload", href: base + file.fileName, as: "font", type: "font/woff2", crossorigin: true },
            injectTo: "head",
          }));
      },
    },
  };
}
