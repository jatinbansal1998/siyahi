# @siyahi/tools

Checks and build helpers for pages built on [`@siyahi/ui`](https://www.npmjs.com/package/@siyahi/ui).
Kept apart from the UI package so installing the UI does not pull in Playwright.

## Lint plugin

An [oxlint](https://oxc.rs) JS plugin, `siyahi`. Every rule runs only in files
that import `@siyahi/ui`.

| Rule                          | Rejects                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `siyahi/no-color-literal`     | hex, `rgb()`, `hsl()`, `oklch()` and other colour literals in strings                                               |
| `siyahi/no-scheme-variant`    | `dark:` and `light:` Tailwind variants                                                                              |
| `siyahi/no-numeric-font-size` | `fontSize: 13`, `fontSize="12px"`                                                                                   |
| `siyahi/no-chart-theme-map`   | a chart config `theme: { light, dark }` map; shadcn's chart applies the dark half only under a `.dark` class        |
| `siyahi/no-raw-colors`        | Tailwind palette colours such as `bg-pink-500` ([@shadcn/lint](https://github.com/shadcn-ui/lint))                  |
| `siyahi/no-arbitrary-values`  | arbitrary values such as `text-[13px]`, `w-[37px]`, `bg-[#fff]` ([@shadcn/lint](https://github.com/shadcn-ui/lint)) |

```json
{
  "jsPlugins": ["@siyahi/tools/lint"],
  "settings": { "shadcn": { "ui": "@siyahi/ui", "themeImports": ["^@siyahi/ui/"] } },
  "rules": { "siyahi/no-color-literal": "error" }
}
```

A Vite+ or ESLint config can spread every rule at once:
`import { recommended } from "@siyahi/tools/lint"`.

## Font preload

A Vite plugin that adds `<link rel="preload" as="font">` tags to the built
`index.html` for the Latin files of Geist and Geist Mono, and Geist's
Latin Extended file, which holds ₹. Without them the browser asks for a font
only once text in it has rendered, so on a slow network the fallback paints
first and Geist swaps in seconds later.

```ts
// vite.config.ts
import { preloadFonts } from "@siyahi/tools/vite";
export default defineConfig({ plugins: [react(), tailwindcss(), preloadFonts()] });
```

It runs in `vite build` only. The fonts stay self-hosted: the tags point at
the files Vite emitted from `@siyahi/ui`'s fontsource imports.

## siyahi-cls

```sh
npx siyahi-cls http://localhost:4173/ [more URLs] [--out cls] [--font "Geist Variable"] [--wait-for h1] [--network slow-3g|none] [--hold-fonts] [--max-cls 0.01]
```

Loads each URL in Chromium with a cold cache over Chrome DevTools' Slow 3G
profile (400 kbit/s, 2 s round trips), 1920 and 390 pixels wide, and reports
how far the page moves after its first paint: Cumulative Layout Shift, the
layout shifts behind it, when the first `--font` face loaded, the
`font-display` in effect, and whether the font was already loaded at the
first paint. It shoots the page as soon as `--wait-for` is visible and again
once the font has loaded and the page has settled, writes both PNGs and an
overlay of the two (ink only the first paint has shows red, ink only the
second has shows cyan), and lists the text boxes that moved between them.

`--hold-fonts` holds every woff2 response until the first shot, so the
fallback always paints first: the worst case, a first visit on which the font
arrives after the page. A page fails when its CLS is above `--max-cls` or a
text box inside the first screen moved; boxes that moved further down are
counted (`moved=` against `in-view=`) and listed, but do not fail it. Run `npx playwright install chromium` once.

## siyahi-shots

```sh
npx siyahi-shots http://localhost:5173/#/page [more URLs] [--out shots] [--gutter 16] [--font Geist] [--chrome '[data-slot="sidebar"]'] [--wait-for h1]
```

Renders each URL in Chromium at 1920 and 390 pixels wide, light and dark, and
writes one full-page PNG per mode to `shots/`. A page taller than 16,000 pixels
is written as equal segments, `<name>-1.png`, `<name>-2.png` and so on, which
together cover the whole page; the run lists every file. A rerun replaces the
page's earlier shots.

It measures the page once the network is quiet, an element matching
`--wait-for` (by default `h1`) is visible, two animation frames have passed
and the fonts are ready, so content a page renders after loading its data is
in the shot. A mode fails when nothing matches within 15 seconds; pass a
selector that only the finished page has, such as `--wait-for '[data-ready]'`. It fails when visible text or a
card comes closer than `--gutter` pixels to either edge, when the page scrolls
sideways, or when the body font is not a loaded `--font` family. A page with
no `@font-face` rule, such as a static report on `report.css`, loads no font
file by design: it only has to name `--font` first, and the run prints
`font=system (no @font-face)`. Content that
scrolls sideways inside its own box is exempt from the gutter, and so is
anything inside `--chrome` (by default the shadcn sidebar, which sits flush to
the edge by design). The font default, Geist, is Siyahi's; pass another family
for other pages. Run `npx playwright install chromium` once.

## siyahi-contrast

```sh
npx siyahi-contrast path/to/theme.css
```

Reads the light `:root` block and the `@variant dark { … }` block inside it.
Every checked token must be set in both; dark never borrows a light value. It
fails unless text colours reach 4.5:1 on the canvas, the card and their own
fills, chart colours reach 3:1 against the card and against the slots next to
them, and every chart colour sits inside sRGB. Slots two apart share a
lightness and are told apart by hue, so series take slots in order.
