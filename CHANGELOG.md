# Changelog

## 0.1.9

Page parts that dash and The Book built for themselves. Published as
`0.1.9-next.<n>` pre-releases.

- `CodeBlock`, `CodeBlockHeader`, `CodeBlockTitle`, `CodeBlockActions`,
  `CodeBlockCopyButton`, `CodeBlockContent`, `CodeBlockLine` and
  `CodeBlockFooter`: shadcn's core code block, as the CLI wrote it. A copy
  button sits in the header beside a title, or alone at the top right, shown on
  hover (always on a touch screen). Long lines scroll sideways; `wrap` breaks
  them. No syntax highlighting: the shiki hook shadcn offers with it is left
  out, since no page highlights and its GitHub themes bring colours from
  outside the theme.
- `DataTableSearchFilter`: niko-table's search across columns, from its
  registry, with a `label` prop for the field's accessible name.
- `DataTableSortHeader`: a column header that sorts on one click, largest (or
  Z) first, then the other way; its title defaults to the column's
  `meta.label`. It turns on the table's sorting itself, like niko-table's own
  sort components.
- `DataTableRowCount`: how many rows the filters leave, "12 of 48", or
  "48 positions" when they leave all. `total` covers data the page narrowed
  before the table.
- `SectionCards` takes `selected` and `onSelect`: each tile becomes a button
  with `aria-pressed`, and the picked one takes a primary ring, in dark mode
  too.
- `ToneProgress`: Progress with its bar in `--positive` or `--negative`.
- `TreemapLegend`: the Treemap's colour scale, five steps each way and no
  change, drawn from the same formula as the tiles, each swatch naming its span.
- `PageSection` (rule, eyebrow, h2, muted lead, action), `PageSubheading` (h3),
  `DataList` with `DataListItem` (label and value pairs) and `InlineCode`.
- `count` in the formatters and `useFormat()`: a whole number with the
  locale's grouping, `1,53,110`.
- The catalogue's code samples are code blocks with a copy button, and a new
  Page layout page shows the page parts.
- The chart cards cover what the Dell page and The Book still drew with raw
  Recharts:
  - `footer`, lines under the chart in the card's footer.
  - `placeholder`, shown in the plot's place, at its height, while data loads
    or after it failed.
  - `referenceLines`, labelled limits (a `y`, dashed) and events (an `x`,
    solid), with an `emphasis` and a label corner.
  - `xDomain` and `xTicks` on the line and area cards: a numeric x axis, so a
    mark can sit between samples.
  - `xTooltipFormatter`, a tooltip heading fuller than the tick.
  - `yDomain` and `yTicks`, a fixed value axis such as 0 to 100%.
  - `curve: "linear"` on the line and area cards, for measured samples.
  - `xLabel` and `yLabel`, axis titles.
  - `xTickDetail`, a second line under each x tick from its row.
  - `var(--positive)` and `var(--negative)` as series colours, and a series'
    `negativeColor` for its bars below zero.
  - `selected` and `onSelect` on `BarChartCard`: a click on a bar picks its
    category and fades the rest.
  - `horizontal` on `BarChartCard`: bars sideways, categories down the left.
- `DistributionBar`, from dashboardcn's `distribution-bar`: one stacked bar
  with a legend. `max` (and `min`) fix its scale, a segment below zero stacks
  left of zero, `markers` draw labelled lines at limits, and `highlighted` and
  `onHover` drive a readout.
- `BarList` takes `max`, so two lists share one scale.
- Stacked bar cards stack by sign: money out sits below zero rather than
  hanging from the top of money in.
- Chart ticks take the theme's muted colour. Recharts 3.8 draws tick labels in
  a layer the core chart's muted-tick rule no longer reaches, so every tick
  was Recharts' fixed `#666` in light and dark.
- A chart card calls its value formatter with the value alone. Recharts calls
  a tick formatter as `(value, index)`, so `useFormat().pct` read the index as
  its decimals and `count` as its locale.
- A `SectionCards` tile takes `disabled`: in a picker it fades and cannot be
  picked, such as a class with no positions.
- `CopyButton`, from MiniDev's `copy-button`: an outline button with a label,
  such as "Copy all", that reads "Copied" with a check for 2 s.
  `CodeBlockCopyButton` stays the icon-only one inside a code block.
- The raw Recharts exports (`Area`, `AreaChart`, `Bar`, `BarChart`,
  `CartesianGrid`, `Line`, `LineChart`, `ReferenceLine`, `XAxis`, `YAxis`) are
  gone. Pages draw charts with `BarChartCard`, `AreaChartCard`,
  `LineChartCard` and `DistributionBar`; dash's pages, the Dell page included,
  and The Book moved to them on `0.1.9-next.2` (dash#95, The Book #34). This
  resolves the dated notes of 0.1.8 and 0.1.9-next.2. A page that still needs
  a raw part imports `recharts` from its own dependency.

## 0.1.8

Chart components that take data as props. Published as `0.1.8-next.<n>`
pre-releases.

- `BarChartCard`, `AreaChartCard` and `LineChartCard`, from shadcn's
  `chart-bar-multiple`, `chart-area-stacked` and `chart-line-multiple` blocks.
  A page passes `data`, the `xKey` its x axis reads, the `series` (a list of
  the field to plot, a label and a chart token, in draw and legend order),
  `valueFormatter`, `xFormatter`,
  optional `yTickFormatter` and a pixel `height`; a range or mode toggle goes
  in `action`, which sits in the card's `CardAction`. The card owns the axes,
  the dashed horizontal grid, Geist Mono ticks, the tooltip and the legend
  below. The tooltip's heading is read from the hovered row, so it names the
  category even when the axis holds numbers such as hours: stock
  `ChartTooltipContent` falls back to the series label there, the "Count on
  every row" bug of dash#88. Bars group or `stacked`; areas overlap or
  `stacked`. A zero line draws when a value goes below zero, and a missing
  value shows as — in the tooltip, not 0. `ChartSeries`,
  `ChartSeriesItem`, `ChartColor` and `SeriesChartProps` type them; a series
  colour is one of `var(--chart-1)` to `var(--chart-5)` or
  `var(--muted-foreground)`, so a theme map or a hex value does not compile.
- The catalogue's area, bar and line examples use them, and a new hourly bar
  example shows a numeric axis. Each entry says when to use it and when to use
  `BarList` (ranked counts by category) instead.
- The catalogue's quarterly bar example has a Grouped / Stacked toggle as its
  header action. It starts grouped, the component's default; 0.1.8-next.1 and
  next.2 showed it stacked only.
- The README has a "Which component" table: need → component.
- 2026-10-21: raw Recharts exports (`Area`, `AreaChart`, `Bar`, `BarChart`,
  `CartesianGrid`, `Line`, `LineChart`, `ReferenceLine`, `XAxis`, `YAxis`) stay
  until dash pages move to the chart components; remove after.

## 0.1.7

Published as `0.1.7-next.<n>` pre-releases.

- `Accordion`, `AccordionItem`, `AccordionTrigger` and `AccordionContent`:
  shadcn's core Accordion on Base UI, as the CLI wrote it. A list of
  questions, such as an FAQ, sits in one bordered group instead of one
  `Collapsible` per item. One item is open at a time; pass `multiple` to let
  several stay open. The catalogue shows both under Components.
- `SectionCards` picks its columns from the number of tiles, so the last row
  never holds one tile alone under fuller rows. Five tiles used to show 4 + 1
  on a wide page; now they run 3 + 2, and one row of five once the container is
  80rem (1280px) wide. Three and six run three across from 48rem; four keep the
  stock 2 then 4. A phone still shows one tile per row. More than six tiles
  keep the stock grid.
- A card's header action drops under the title and description, left-aligned,
  when the header is narrower than 24rem (384px, so any phone). Stock
  `CardHeader` kept it in a column of its own at every width: on a phone a
  two-item toggle squeezed the title to a few words and ran past the card's
  edge, where the card cut the second item off. The rule is a container query
  in `styles.css`; `card.tsx` is unchanged. A `CardAction` holding only a
  `Badge`, like a stat tile's, stays top right. Pages that worked around it
  with `max-md:grid-cols-1!` on the header can drop the classes.
- `siyahi-shots` fails a page when a heading, text, link, button or field is
  cut off at the side by a box that hides its overflow, and names it:
  `button "Monthly return" by 56px`. The page-level sideways-scroll check
  could not see this, since a card that cuts content off never makes the
  document wider.

## 0.1.6

Treemap tiles can be tapped, and two open looks are settled. Published as
`0.1.6-next.<n>` pre-releases.

- `Treemap` takes `selected` and `onSelect`. A tap or click on a tile gives
  `onSelect` the item; pass it back as `selected` and its tile gets a ring. A
  second tap on it, or a tap anywhere else, gives `null`. The page owns the
  selection, so filtering the item out drops its ring with it. A phone has no hover,
  so this is how a reader there gets a tile's figures; the catalogue example
  prints them in a line under the map. `onHover` is unchanged.
- Cards stay as luma draws them: every `Card`, stat tiles included, keeps
  `shadow-md`. Flat cards (every card, or only the stat tiles) were tried side
  by side and not taken, which closes the question 0.1.5 left open. Apps may
  build on the shadow.
- Categories stay neutral: a sector, a broker or a unit's kind is an outline
  `Badge`. A badge tinted from a chart hue was tried and not taken, so nothing
  new ships for it.

## 0.1.5

shadcn's `base-luma` style replaces `base-vega`, published as `0.1.5-next.<n>`
pre-releases.

- Core components are luma's: cards are `rounded-4xl` with `shadow-md` and a
  fainter ring, buttons and the filter trigger are pills, menu panels
  (dropdown, context menu, select) are `rounded-3xl` with `rounded-2xl` items,
  and tables are roomier: headers `h-10` → `h-12`, cells `p-2` → `p-3`. A
  one-line row is 8px taller; a row whose cells wrap grows more. The theme is unchanged: luma's neutral surfaces and
  radius are vega's, and Siyahi keeps Geist, its chart palette and its meaning
  colours. Contrast is unchanged (64/64 pairs).
- Sizes apps will see: `SidebarMenuButton size="lg"` is `h-14` (was `h-12`),
  so a brand row in the sidebar, like The Book's and the catalogue shell's,
  is 8px taller; dropdown and context menus have a 192px minimum width
  (`min-w-48`, was 128px), so data-table column menus open wider.
- Data table: header and body cells take the core table's luma padding, so the
  data table and a plain `Table` share one row height.
- Open for 0.1.6: cards, stat tiles included, now carry luma's `shadow-md`.
  The owner prefers flat cards (no gradient, and likely no `shadow-md` on
  stat tiles), so expect that shadow to go in 0.1.6. Apps should not build
  on it.

## 0.1.4

Four small fixes, published as `0.1.4-next.<n>` pre-releases.

- Data table: a page's sticky header no longer slides under the table. The
  table's pinned cells (z-index 10 and 20) and sticky header row (30) ranked
  against the whole page, so The Book's `sticky top-0 z-10` masthead was
  painted under the table's header row and pinned column, on a phone and on
  desktop alike. The table's scroll container
  is now `isolate`, a stacking context of its own, so those z-indexes only
  rank inside the table. A sticky header above a data table needs a z-index of
  1 or more (`z-1` will do); it no longer has to outrank 30. At 0 or `auto`
  the table, coming later in the page, still paints over it.
- `SectionCards`: stat tiles use the plain card surface; the dashboard-01
  gradient is gone. A tile is the stock `Card` in light and dark, like every
  other card on the page.
- `siyahi-shots --report` checks a static HTML report, which loads no font
  file by design. Without it, every page on `report.css` failed with "Geist is
  named but never loaded". With it, the body must still name `--font` first,
  but the viewer's installed font or the system fallback may draw it, and the
  run prints `font=Geist (report, system fallback allowed)`. Without the flag
  the check is as strict as before: a page that names Geist and loads no font
  fails.
- A merge to `main` that changes only `docs/` or Markdown files at the repo
  root no longer publishes a pre-release.

## 0.1.3

The page no longer moves when Geist loads. On a first visit over a slow
network the system font painted first and every paragraph rewrapped when
Geist swapped in (CLS 0.069 on the catalogue's home page at 1920 wide).
Published as `0.1.3-next.<n>` pre-releases.

- The theme names `Geist Fallback` and `Geist Mono Fallback` right after Geist
  and Geist Mono: Arial (or Liberation Sans, Arimo) and Courier New (or
  Liberation Mono, Cousine) scaled to Geist's width at each weight and given
  its ascent, descent and line gap. `scripts/generate.ts` writes them to
  `styles/fallback-fonts.css`. Text set in the fallback is within 1% of
  Geist's width.
- `max-w-prose` is 43.1em, the 65ch it measured in Geist. A ch is the width of
  the "0" in whichever font is drawing, so every prose block rewrapped on the
  swap, fallback or not.
- `@siyahi/tools/vite` exports `preloadFonts()`, a Vite plugin that preloads
  Geist's Latin and Latin Extended (₹) files and Geist Mono's Latin file from
  the built `index.html`, so the fonts download with the scripts and are
  usually in before the first paint.
- `siyahi-cls` measures how far a page moves after its first paint on a slow
  network, at 1920 and 390 wide: CLS, the shifts behind it, when the font
  loaded, and an overlay of the first paint and the settled page.
- Catalogue: the colour swatches on Foundations read their values while
  rendering instead of after, so they no longer grow a line after the first
  paint.

## 0.1.2

Gaps found while porting The Book's Holdings view, published as
`0.1.2-next.<n>` pre-releases.

- Data table column menus no longer crash. Opening `DataTableColumnActions`,
  `DataTableColumnSortMenu` or a menu holding `DataTableColumnSortOptions`
  threw `Base UI: MenuGroupContext is missing` and unmounted the app; their
  labels now sit in a `DropdownMenuGroup`.
- Data table, dark mode: the pinned column and the sticky header paint the
  card's colour (`--card`), not the page's, so a table in a card has no darker
  stripe or header row. A table placed straight on the page in dark mode now
  shows a slightly lighter pinned column and header instead. Pinned cells also
  take their row's hover and selected tint, which their inline background used
  to hide.
- `Treemap`:
  - `onHover(item | null)` gets the item under the pointer, and null when the
    pointer moves onto a group's name or leaves the map, for a tooltip or for
    highlighting the same item elsewhere. `Treemap` is generic over the item type, so `onHover` hands back
    the caller's own fields.
  - `range` sets ±range, the change as a fraction that takes the deepest of
    the five heat steps. Default `0.05` (±5%), as before; a range that is not a
    positive number uses the default.
  - `TreemapItem.change` takes `null`: a muted tile marked "—" rather than
    "0.0%".
  - `TreemapItem.key` keys a tile when names repeat, such as one symbol held at
    two brokers. Defaults to `name`.
  - `TreemapItem.group` puts the tiles of one group, such as a sector, together
    under its name. The name draws even for a group of one.
  - A zero, negative or non-finite `weight` draws no tile. Negative weights
    used to push tiles out of the box, and an infinite one blanked the map.
  - A tile's name and change are clipped to the tile instead of running into
    the next one.
- `BarList`: `BarListItem.detail` is a `ReactNode` drawn after the label and
  outside its link, such as a `Delta`. It keeps its own colour and does not
  shrink, so a long label truncates first.

## 0.1.1

Fixes from the first two consumers, dash and The Book, published as
`0.1.1-next.<n>` pre-releases.

- `AppSidebar` and `NavMain`: an item without `items` is a plain link with
  `isActive` and a tooltip, so a nav of flat views navigates; an item with
  `items` stays a collapsible group. A flat item's optional `linkProps` are
  spread onto its anchor (handlers such as `onMouseEnter` included). On a phone,
  following any link in the drawer closes it. `AppSidebar` accepts
  `collapsible="none"` to draw in place.
- Alert icons: the documented warning icon is `text-warning!`. Stock `Alert`
  colours its icons through a selector that outranks a plain `text-warning`,
  which drew the icon in the foreground colour.
- `LocalTime withDate`, `useFormat().time(value, { withDate: true })` and
  `time(value, locale, { withDate: true })` write the date before the time in
  the same zone: `26 Jun 2026, 09:41 IST`.
- `siyahi-shots`: a page taller than 16,000px is written as `-1`, `-2`, …
  segments that cover all of it, instead of failing. The page is measured only
  once `--wait-for` (default `h1`) is visible, two animation frames have passed
  and the fonts are ready.

## 0.1.0

First release, published as `0.1.0-next.<n>` pre-releases.

- `@siyahi/ui`: shadcn/ui in the `base-vega` style on Base UI and Tailwind v4,
  with the stock neutral theme, `--positive`, `--negative`, `--warning`, `--link`
  and a five-hue chart palette, all checked for contrast in light and dark.
- Registry add-ons: niko-table data table, three heatmaps, dashboardcn bar list,
  `SectionCards` and the `sidebar-07` shell.
- `Delta`, `PriceChart`, `Treemap`, `LocalTime`, `SiyahiProvider`, and the
  `money`, `moneyCompact`, `pct` and `time` formatters, defaulting to en-IN,
  INR and Asia/Kolkata.
- `report.css` for static HTML reports.
- `@siyahi/tools`: the oxlint plugin, `siyahi-contrast` and `siyahi-shots`.
