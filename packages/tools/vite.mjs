// @ts-check
// A Vite plugin that preloads the Latin files of Geist and M PLUS 1 Code, the
// fonts nearly every Siyahi page draws first. Without it the browser asks for
// a font only once the page has rendered text in it, so on a slow network the
// fallback paints and Geist swaps in seconds later; with it the font
// downloads alongside the scripts and is usually there before the first paint.

// fontsource's file names, kept by Vite in each emitted asset's names. Each
// latin-ext file holds ₹, which the default locale prints on every amount, in
// the mono on a terminal page.
const PRELOADED = new Set([
  "geist-latin-wght-normal.woff2",
  "geist-latin-ext-wght-normal.woff2",
  "m-plus-1-code-latin-wght-normal.woff2",
  "m-plus-1-code-latin-ext-wght-normal.woff2",
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
        // Two copies of fontsource in one bundle emit two files per face; one preload each is enough.
        const files = new Map();
        for (const file of Object.values(bundle ?? {})) {
          if (file.type !== "asset") continue;
          const face = file.names.find((name) => PRELOADED.has(name));
          if (face && !files.has(face)) files.set(face, file.fileName);
        }
        return [...files.values()].map((fileName) => ({
          tag: "link",
          attrs: { rel: "preload", href: base + fileName, as: "font", type: "font/woff2", crossorigin: true },
          injectTo: "head",
        }));
      },
    },
  };
}
