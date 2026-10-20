<p><img src="assets/icon.svg" width="48" height="48" alt="Siyahi"></p>

# Siyahi

Siyahi (Hindi for ink) is a small design system for data-heavy React apps:
stock [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com) and
Tailwind CSS v4, shipped as one npm package, `@siyahi/ui`. It adds a theme with
four meaning colours and a five-hue chart palette that pass WCAG contrast in
light and dark, a few finance components, locale-aware formatters, a lint that
keeps pages on the theme, and a catalogue site that is the documentation.

**Catalogue:** https://siyahi.jatinbansal.com

## Install

Siyahi is pre-1.0; releases go out under the `next` tag. It needs React 19 and
Tailwind CSS v4, compiled by the Tailwind Vite plugin: the package's stylesheet
is Tailwind source, so a plain CSS import leaves every component unstyled.

```sh
npm install @siyahi/ui@next tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/index.css */
@import "@siyahi/ui/styles.css";
```

```tsx
// src/main.tsx
import "./index.css";
import { SiyahiProvider } from "@siyahi/ui";
createRoot(root).render(
  <SiyahiProvider>
    <App />
  </SiyahiProvider>,
);
```

Everything comes from `@siyahi/ui`: the shadcn components, the registry
add-ons (data table, heatmaps, stat tiles, sidebar), Siyahi's own components
and the Recharts pieces charts are built from. Add `lucide-react` only if your
own code imports icons. A Next.js app compiles the same stylesheet through
`@tailwindcss/postcss` instead of the Vite plugin.

### Also on GitHub releases

Every merge to `main` also attaches both tarballs to a GitHub release
(`v<version>`, plus a rolling `next`). They are a fallback if npm is unreachable:
`npm install --allow-remote=root https://github.com/jatinbansal1998/siyahi/releases/download/v<version>/siyahi-ui-<version>.tgz`.

## What is in it

- **shadcn/ui components** in the `base-vega` style, installed with the shadcn
  CLI and never edited.
- **Registry add-ons**, copied once with their origin and licence recorded: a
  data table on TanStack Table, calendar, weekday and status heatmaps, a ranked
  bar list, the `SectionCards` stat tile and the `sidebar-07` app shell.
- **Siyahi components**: `Delta` (a signed figure with ▲ ▼), `PriceChart`
  (TradingView Lightweight Charts in theme colours), `Treemap` (holdings heat
  map), `LocalTime` (a time in the configured zone with the viewer's own clock
  in a tooltip) and `SiyahiProvider`.
- **Formatters**: `money`, `moneyCompact`, `pct` and `time`, or `useFormat()`
  for the same bound to the provider's locale.
  `useFormat().time(value, { withDate: true })` (or
  `time(value, locale, { withDate: true })`) and `<LocalTime withDate>` write
  the date first: `20 Oct 2026, 14:30 IST`.
- **`report.css`** for static HTML reports that do not use React: the theme as
  plain CSS variables plus base body styles, with no network requests.

## Locale

Numbers, money and times default to Indian English, rupees and IST:
`₹1,53,110`, `₹2.4L`, `₹40Cr`, `14:30 IST`. In an Indian-region locale,
`moneyCompact` prints amounts under one lakh in full (`₹99,999`), never as `K`.
Pass another locale to the provider and every formatter and component under it
follows:

```tsx
<SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
```

The formatters print a minus sign and nothing else. A signed figure (a gain, a
loss, a change) goes through `<Delta>`, which adds ▲ or ▼ and the meaning
colour. Time zone names come from the runtime's ICU data; a slim Node or
browser build may print `GMT+5:30` where a full one prints `IST`.

## Dark mode

The colour scheme follows the device (`prefers-color-scheme`). There is no
toggle and no class to set. The theme's dark values sit under the same `dark`
variant as the `dark:` utilities, so an app that wants its own toggle swaps one
line after the import and sets the `dark` class on `<html>`:

```css
@import "@siyahi/ui/styles.css";
@custom-variant dark (&:where(.dark, .dark *));
```

Both the tokens and the utilities then follow the class. Set `color-scheme` on
`<html>` yourself as well, so scrollbars and form controls match.

## Lint

`@siyahi/tools` ships an [oxlint](https://oxc.rs) plugin. Its rules run only in
files that import `@siyahi/ui`, so older pages are left alone. They reject
colour literals (hex, `rgb()`, `oklch()`), Tailwind palette colours, Tailwind
arbitrary values such as `text-[13px]`, `dark:` and `light:` variants,
numeric font sizes, and chart configs with a per-scheme `theme` map (shadcn's
chart applies its dark half under a `.dark` class Siyahi never sets; name a
chart token with `color: "var(--chart-1)"` instead). Two of the rules are
[`@shadcn/lint`](https://github.com/shadcn-ui/lint)'s, scoped the same way.

```sh
npm install --save-dev @siyahi/tools@next oxlint
```

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
    "siyahi/no-arbitrary-values": "error"
  }
}
```

`@siyahi/tools` also has `siyahi-shots` (screenshots of a page at 1920 and 390
pixels wide in both schemes, with layout checks) and `siyahi-contrast` (the
theme contrast check). See [packages/tools](packages/tools/README.md).

## This repository

| Path              | What                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| `packages/ui`     | `@siyahi/ui`. The theme is `styles/siyahi.css`, the only file with colour values. |
| `packages/tools`  | `@siyahi/tools`: lint plugin, contrast check, screenshot script.                  |
| `apps/catalogue`  | The catalogue site, a Vite app deployed as a Cloudflare Worker.                   |
| `assets/icon.svg` | The mark.                                                                         |

Development uses pnpm and [Vite+](https://viteplus.dev):

```sh
pnpm install
pnpm --filter @siyahi/tools exec playwright install chromium   # once; the screenshot tests use it
pnpm check      # format, lint, unused code, generated files, build, typecheck, tests
pnpm dev        # the catalogue on localhost
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before adding anything.

## Licence

MIT, see [LICENSE](LICENSE). Code copied from other projects keeps its own
notice; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
