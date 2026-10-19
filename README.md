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

Siyahi is pre-1.0; releases go out under the `next` tag. You need React 19 and
Tailwind CSS v4 on Vite.

```sh
npm install @siyahi/ui@next lucide-react
```

```css
/* src/index.css */
@import "@siyahi/ui/styles.css";
```

```tsx
// src/main.tsx
import "./index.css";
import { Button, Card, SiyahiProvider } from "@siyahi/ui";
createRoot(root).render(
  <SiyahiProvider>
    <App />
  </SiyahiProvider>,
);
```

Everything comes from `@siyahi/ui`: the shadcn components, the registry
add-ons (data table, heatmaps, stat tiles, sidebar), Siyahi's own components
and the Recharts pieces charts are built from. `lucide-react` is for icons.

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
- **`report.css`** for static HTML reports that do not use React: the theme as
  plain CSS variables plus base body styles, with no network requests.

## Locale

Numbers, money and times default to Indian English, rupees and IST:
`₹1,53,110`, `₹2.4L`, `₹40Cr`, `14:30 IST`. Pass another locale to the provider
and every formatter and component under it follows:

```tsx
<SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
```

## Dark mode

The colour scheme follows the device (`prefers-color-scheme`). There is no
toggle and no class to set. If your app wants its own toggle, swap the dark
variant after the import and set the `.dark` class yourself:

```css
@import "@siyahi/ui/styles.css";
@custom-variant dark (&:where(.dark, .dark *));
```

You then also need to repeat the dark values under `.dark`, since the theme
declares them under the media query.

## Lint

`@siyahi/tools` ships an [oxlint](https://oxc.rs) plugin. Its rules run only in
files that import `@siyahi/ui`, so older pages are left alone. They reject
colour literals (hex, `rgb()`, `oklch()`), Tailwind palette colours, Tailwind
arbitrary values such as `text-[13px]`, `dark:` and `light:` variants, and
numeric font sizes. Two of the rules are
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
pnpm check      # format, lint, unused code, generated files, build, typecheck, tests
pnpm dev        # the catalogue on localhost
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before adding anything.

## Licence

MIT, see [LICENSE](LICENSE). Code copied from other projects keeps its own
notice; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
