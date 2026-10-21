<p><img src="https://raw.githubusercontent.com/jatinbansal1998/siyahi/main/assets/icon.svg" width="48" height="48" alt="Siyahi"></p>

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
npm install --save-dev @siyahi/tools@next
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import { preloadFonts } from "@siyahi/tools/vite";
export default defineConfig({ plugins: [react(), tailwindcss(), preloadFonts()] });
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

`preloadFonts()` adds `<link rel="preload">` tags for Geist and Geist Mono to
the built `index.html`, so the fonts download with the scripts instead of after
the first paint. Until they arrive the theme draws Arial (or its Linux twins,
Liberation Sans and Arimo) scaled to Geist's metrics, so nothing moves when
Geist swaps in. An app that renders its own HTML adds the tags itself, with
the hashed URLs of `geist-latin-wght-normal.woff2`,
`geist-latin-ext-wght-normal.woff2` and `geist-mono-latin-wght-normal.woff2`.

Everything comes from `@siyahi/ui`: the shadcn components, the registry
add-ons (chart cards, data table, heatmaps, stat tiles, sidebar) and Siyahi's
own components. Add `lucide-react` only if your
own code imports icons. A Next.js app compiles the same stylesheet through
`@tailwindcss/postcss` instead of the Vite plugin.

### Also on GitHub releases

Every merge to `main` also attaches both tarballs to a GitHub release
(`v<version>`, plus a rolling `next`). They are a fallback if npm is unreachable:
`npm install --allow-remote=root https://github.com/jatinbansal1998/siyahi/releases/download/v<version>/siyahi-ui-<version>.tgz`.

## What is in it

- **shadcn/ui components** in the `base-luma` style, installed with the shadcn
  CLI and never edited.
- **Registry add-ons**, copied once with their origin and licence recorded:
  bar, area and line chart cards from shadcn's chart blocks, a data table on
  TanStack Table, calendar, weekday and status heatmaps, a ranked
  bar list, the `SectionCards` stat tile and the `sidebar-07` app shell.
- **Siyahi components**: `Delta` (a signed figure with ▲ ▼), `PriceChart`
  (TradingView Lightweight Charts in theme colours), `Treemap` (holdings heat
  map; hover or tap a tile for its figures) with `TreemapLegend` (its colour
  scale), `LocalTime` (a time in the configured zone with the viewer's own clock
  in a tooltip), `ToneProgress` (Progress in a meaning colour), the page parts
  `PageSection`, `PageSubheading`, `DataList` and `InlineCode`, the data table
  parts `DataTableSortHeader` (sorts on one click) and `DataTableRowCount`
  ("12 of 48"), and `SiyahiProvider`.
- **Cards and badges as installed**: every `Card`, stat tiles included, keeps
  luma's `rounded-4xl`, `shadow-md` and faint ring. A category (a sector, a
  broker, a unit's kind) is an outline `Badge`: categories stay neutral, and
  colour is left to the four meaning colours and the charts. On a narrow card
  (header under 24rem, so any phone) a header action such as a toggle drops
  under the title and description, left-aligned; a stat tile's badge stays
  top right.
- **Formatters**: `count`, `money`, `moneyCompact`, `pct` and `time`, or `useFormat()`
  for the same bound to the provider's locale.
  `useFormat().time(value, { withDate: true })` (or
  `time(value, locale, { withDate: true })`) and `<LocalTime withDate>` write
  the date first: `20 Oct 2026, 14:30 IST`.
- **`report.css`** for static HTML reports that do not use React: the theme as
  plain CSS variables plus base body styles, with no network requests.

## Which component

| Need                                                                    | Component                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Values over time or another ordered axis (months, hours, price buckets) | `BarChartCard`, `AreaChartCard` or `LineChartCard`                  |
| Counts or amounts per period, one series or several                     | `BarChartCard`; `stacked` when the series add up to a total         |
| A running level, such as a portfolio's value against money put in       | `AreaChartCard`                                                     |
| Series compared point by point, such as a return against an index       | `LineChartCard`                                                     |
| Samples in time with limits and events marked                           | `LineChartCard` with `xDomain`, `xTicks` and `referenceLines`       |
| Long category names, such as sectors                                    | `BarChartCard` with `horizontal`                                    |
| A gain above zero and a loss below it                                   | a series with `color` and `negativeColor`                           |
| Ranked counts or amounts by category (a name, a bar and a figure)       | `BarList`; give two lists one `max` to share a scale                |
| Where a budget sits, a split of a whole, or losses against gains        | `DistributionBar`                                                   |
| Headline figures with their change                                      | `SectionCards`, with a `Delta` in each badge                        |
| One instrument's price history                                          | `PriceChart`                                                        |
| Holdings sized by weight and coloured by change                         | `Treemap`                                                           |
| Activity by day, by weekday and hour, or a status over time             | `CalendarHeatmap`, `WeekdayHeatmap`, `StatusHeatmap`                |
| Rows to sort and filter                                                 | `DataTable`, inside a `Card`                                        |
| A column that sorts on one click; a search and an "n of m" count        | `DataTableSortHeader`; `DataTableSearchFilter`, `DataTableRowCount` |
| Stat tiles that pick a scope for the page                               | `SectionCards` with `selected` and `onSelect`                       |
| A share or a part of a whole, coloured as a gain or a loss              | `ToneProgress`                                                      |
| The colour scale under a `Treemap`                                      | `TreemapLegend`, with the map's `range`                             |
| One part of a long page: rule, eyebrow, heading, lead, action           | `PageSection`, with `PageSubheading` inside                         |
| Label and value pairs, such as a record's fields                        | `DataList` and `DataListItem`                                       |
| A command or file to copy, wrapped or scrolling                         | `CodeBlock` with `CodeBlockCopyButton`                              |
| A command, file or identifier inside prose                              | `InlineCode`                                                        |
| A signed figure (a gain, a loss, a change)                              | `Delta`                                                             |
| A time, with the viewer's own clock on hover                            | `LocalTime`                                                         |

The three chart cards take the rows, the field the x axis reads and the series,
and own everything else: the card and its header action (a range or mode
toggle), the axes, the dashed horizontal grid, Geist Mono ticks, a tooltip that
names the hovered point and gives each series' formatted value, and the legend
below. Props cover the rest: a footer, a placeholder while data loads,
reference lines, a numeric x axis, a fixed value axis, axis titles, a second
line under each tick, a picked category, sideways bars and straight segments.
A page never puts Recharts axes, grids or tooltips together itself.

```tsx
<BarChartCard
  title="Orders by hour"
  data={[
    { hour: 9, orders: 42 },
    { hour: 10, orders: 31 },
  ]}
  xKey="hour"
  xFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`}
  series={[{ key: "orders", label: "Orders", color: "var(--chart-1)" }]}
  height={256}
/>
```

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
pixels wide in both schemes, with layout checks), `siyahi-cls` (how far a page
moves after its first paint on a slow network) and `siyahi-contrast` (the
theme contrast check). See [packages/tools](packages/tools/README.md).

## This repository

| Path              | What                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| `packages/ui`     | `@siyahi/ui`. The theme is `styles/siyahi.css`, the only file with colour values.  |
| `packages/tools`  | `@siyahi/tools`: lint plugin, font preload, contrast, screenshot and shift checks. |
| `apps/catalogue`  | The catalogue site, a Vite app deployed as a Cloudflare Worker.                    |
| `assets/icon.svg` | The mark.                                                                          |

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
