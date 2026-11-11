# @siyahi/tools

Checks and build helpers for pages built on [`@siyahi/ui`](https://www.npmjs.com/package/@siyahi/ui).
Kept apart from the UI package so installing the UI does not pull in Playwright.

## Lint plugin

An [oxlint](https://oxc.rs) JS plugin, `siyahi`. Every rule runs only in files
that import `@siyahi/ui`.

```sh
npm install --save-dev @siyahi/tools@next oxlint
```

| Rule                          | Rejects                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `siyahi/no-color-literal`     | hex, `rgb()`, `hsl()`, `oklch()` and other colour literals in strings                                                                                           |
| `siyahi/no-scheme-variant`    | `dark:` and `light:` Tailwind variants                                                                                                                          |
| `siyahi/no-numeric-font-size` | `fontSize: 13`, `fontSize="12px"`                                                                                                                               |
| `siyahi/no-chart-theme-map`   | a chart config `theme: { light, dark }` map; shadcn's chart applies the dark half only under a `.dark` class                                                    |
| `siyahi/no-raw-colors`        | Tailwind palette colours such as `bg-pink-500` ([@shadcn/lint](https://github.com/shadcn-ui/lint))                                                              |
| `siyahi/no-arbitrary-values`  | arbitrary values such as `text-[13px]`, `w-[37px]`, `bg-[#fff]` ([@shadcn/lint](https://github.com/shadcn-ui/lint))                                             |
| `siyahi/no-restyle`           | classes that change a component's spacing, colour, shape or type, such as `<CardContent className="gap-4">` ([@shadcn/lint](https://github.com/shadcn-ui/lint)) |

```json
{
  "jsPlugins": ["@siyahi/tools/lint"],
  "settings": { "shadcn": { "ui": "@siyahi/ui", "themeImports": ["^@siyahi/ui/"] } },
  "rules": {
    "siyahi/no-color-literal": "error",
    "siyahi/no-scheme-variant": "error",
    "siyahi/no-numeric-font-size": "error",
    "siyahi/no-chart-theme-map": "error",
    "siyahi/no-raw-colors": "error",
    "siyahi/no-arbitrary-values": "error",
    "siyahi/no-restyle": "error"
  }
}
```

`siyahi/no-restyle` lets a page place a component (margin, width, grid and
flex placement) and nothing else; `Collapsible` and `CollapsibleContent`, which
draw nothing of their own, may also take spacing. Put anything else on a plain
element inside or around the component: `<CardContent><div className="flex
flex-col gap-4">`, `<TableCell><span className="font-mono">`,
`<div className="rounded-lg border"><Command>`. Body text is already
`tabular-nums`, so cells need no class for it.

A Vite+ or ESLint config can spread every rule at once:
`import { recommended } from "@siyahi/tools/lint"`.

One more rule is for a component library's own types rather than for pages, so
it runs in every file it is turned on for and is not in `recommended`:
`siyahi/optional-accepts-undefined` rejects an optional property that does not
take undefined, such as `tone?: Tone`, and `--fix` writes
`tone?: Tone | undefined`. Under TypeScript's `exactOptionalPropertyTypes` a
page can only pass `tone: loss ? "negative" : undefined` to the second.
Siyahi runs it on its own package.

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

The theme's fallback fonts match Geist's metrics until it loads: Arial or its
Linux equivalents for body text, Courier New for mono. If an app renders its
own HTML, add preload tags for the build's hashed URLs of
`geist-latin-wght-normal.woff2`, `geist-latin-ext-wght-normal.woff2` and
`geist-mono-latin-wght-normal.woff2`.

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
npx siyahi-shots http://localhost:5173/#/page [more URLs] [--out shots] [--gutter 16] [--font Geist] [--chrome '[data-slot="sidebar"]'] [--wait-for h1] [--report] [--widths 1920,390] [--script probe.mjs]
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
sideways, when text or a control (a heading, paragraph, cell, link, button or
field) is cut off at the side by a box that hides its overflow, such as a card,
or when the body font is not a loaded `--font` family. The cut-off check names
each element and the pixels it loses, `button "Monthly return" by 56px`; the
page never scrolls sideways in that case, so the scroll check cannot see it. Pass
`--report` for a static HTML report on `report.css`, which loads no font file
by design: the body must still name `--font` first, but the viewer's installed
font or the system fallback may draw it, and the run prints
`font=Geist (report, system fallback allowed)`. Without `--report`, a page that
names Geist and loads no font fails. Content that
scrolls sideways inside its own box is exempt from the gutter, and so is
anything inside `--chrome` (by default the shadcn sidebar, which sits flush to
the edge by design). The font default, Geist, is Siyahi's; pass another family
for other pages. Run `npx playwright install chromium` once.

Pass `--widths 320,390,768,1366,1920` to include small phones, tablets and laptops;
each width runs in light and dark. The check also rejects a scrolling table whose
frozen columns occupy more than half its available width.

A page error or a console error, such as a failed request, fails the mode and is
printed under it.

To check a control, hover or tooltip, pass `--script` a module whose default
export takes Playwright's `page` and the mode (`{ name, width, height, dark }`).
It runs in every mode once the page is ready, at the mode's screen size; whatever
it returns is printed as `data=<JSON>` under the mode, and the checks measure the
page as the script left it. The full-page shot is taken after the viewport grows
to the page's height, which can undo a hover or close a tooltip, so take the
picture of an interaction inside the script, in the state it made. A locator's
`screenshot` gives just the card:

```js
// hover.mjs: the tooltip of a chart's first bar, as text and as a picture
export default async (page, mode) => {
  const card = page.locator('[data-slot="card"]', { hasText: "Revenue by channel" });
  await card.locator(".recharts-bar-rectangle").first().hover();
  await card.screenshot({ path: `shots/hover-${mode.name}.png` });
  return (await card.locator(".recharts-tooltip-wrapper").innerText()).split("\n");
};
```

```sh
npx siyahi-shots http://localhost:4173/#/data/bar-chart --script hover.mjs
```

## siyahi-contrast

```sh
npx siyahi-contrast path/to/theme.css
```

Reads the light `:root` block and the `@variant dark { … }` block inside it.
Every checked token must be set in both; dark never borrows a light value. It
checks each pair on the canvas and on the card, blending a translucent fill over
the surface under it. It fails unless text reaches 4.5:1 on the page, on its own
fill and on the tints Siyahi's components put it on (Callout washes, the
destructive tint and its hover, code-line fills, treemap heat steps), a field's
edge, the focus ring, a selected tab and every chart and meaning colour reach
3:1 against what is next to them, every bar colour's tint (`--bar-tint`) reaches
1.5:1 against the card and each slot's against the next slot's, and every colour sits inside sRGB. Slots two
apart share a lightness and are told apart by hue, so series take slots in
order.
