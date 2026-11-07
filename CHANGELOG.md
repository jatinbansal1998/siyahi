# Changelog

## 0.1.9

- The heat steps are theme tokens, `--heat-1` to `--heat-5`, light and dark
  apart, read by Treemap, ChangeGrid, a signed CalendarHeatmap and the
  contrast check alike (they were typed into `lib/heat.ts` and the checker
  separately). The Foundations page draws them from the tokens, so it shows
  dark mode's own steps. CONTRIBUTING has a "Changing the palette" section.
- New: `HistogramChartCard` counts raw values in buckets of one round width,
  such as response times by 50 ms, and marks the median or a high percentile
  (`marks`), with each exact value written under the chart; marks that share a
  bucket share one line and name. Every chart card's reference lines now sit on
  a card-coloured band, so they stay traceable across bars and areas.
- New: `DrawdownChartCard` shows how far a level sits below the highest it had
  reached, such as a fund's or a cash balance's fall from its peak: the area
  hangs from zero in the loss colour and a dashed line names the deepest fall.
  The page gives the levels; the card keeps the running peak.
  Every chart card's reference-line labels now carry a card-coloured halo, so
  they read over a bar or an area they cross.
- `CalendarHeatmap` takes `signed` (and `range`): each day is green or red by
  its sign, deeper the larger it is, on the same heat steps as Treemap and
  ChangeGrid, inside a full-colour edge, a loss round and a gain square, so
  the sign never rests on colour alone; the legend shows those shapes and,
  given a `valueFormatter`, where the deepest step sits. For a daily profit or
  loss. Hovering, highlighting or focusing a day outlines it instead of fading
  it, and a focused day's ring now draws. Every heat scale treats NaN and
  Infinity as no figure.
- `ScatterChartCard` takes a `size` per point, which sets the dot's area (the
  largest drawn first, as a faint tint inside a full edge, so overlaps show
  through), and `quadrants`, dashed lines at an x and a y value with a name in
  each corner. Names beside dots now keep clear of a big dot's whole area and of
  the corner names.
- `ScatterChartCard`: each item as a dot by two measures, such as size against
  growth, for many items where a treemap's boxes get too small to name. Every
  dot takes one colour, since categories stay neutral. An x axis can be log,
  ticked at 1, 2 and 5. The leading points' names sit beside their dots wherever
  they cover no other name or dot, measured in the page's font at its size. The
  tooltip lists the page's rows, which a screen reader also hears. A tap, Enter
  or Space rings a dot (`selected`, `onSelect`), and the arrow keys walk the
  dots. A point with a null y is not drawn.
- New: `SlopeChart` draws each item as a line from a value on the left to one
  on the right, such as share of sales last year and this, or a store's mix
  against the region's. Lines are grey and `highlighted` ones take `--chart-1`;
  names sit on the left, values at both ends, nudged apart so none overlap; a
  screen reader hears each item's two values. Treemap's label fitting moves to
  `lib/fit-text.ts`, shared with SlopeChart.
- New: `ChangeGrid` lays out signed changes rows by columns, such as sales
  growth by month and year or profit by store and quarter: every cell writes
  its figure with its sign on the Treemap's heat tint, `null` months are muted
  `—`, an optional total column, and row labels that stay in view while a phone
  scrolls. The heat scale moves from `lib/treemap.ts` to `lib/heat.ts`; the
  contrast check adds text on a muted (no change) cell.
- New: `WaterfallChartCard` bridges a running total step by step, such as a
  year's profit month by month or revenue from last year to this by store.
  Rises and falls are tinted green and red inside a full edge, totals are solid
  `--chart-1`, and a dashed line carries each level to the next bar.
  `horizontal` lays it sideways for long names. The band behind a hovered
  category on every chart card is now 40% `--muted` (light `--chart-2` and
  `--chart-4` bars were 2.9:1 against the full band), and a chart card's legend
  wraps on a phone instead of running five series' names past the card.
- `StatusHeatmap` fills a degraded day only in the lower half of its bar,
  over the healthy grey, in the strip and the legend, so degraded and critical
  days differ by shape and not only by hue (amber and red are about 1.4:1
  apart). The bar keeps its full height and tap target.
  A day with no data is hollow, an outline at 3:1, unless the page colours
  that state (its grey fill was 1.4:1 from a healthy day).
- `StatusHeatmap` draws a healthy day at 30% grey (was 40%), so a degraded
  day's amber reaches 3:1 against it in light mode (was 2.7:1). The contrast
  check now covers degraded and critical days against a healthy one.
  Hovering, highlighting or focusing a day outlines it (the text colour, or
  the focus ring's for the keyboard) instead of fading it, which had dropped a
  degraded day under 3:1; a focused day's ring now draws at all.
- `Delta` sits on the text's baseline again: its icon had lifted the line and
  made table rows taller. A button rendered as a popover or menu trigger keeps
  the faint button edge in dark mode instead of the field edge.
- `StatusAlert` replaces `WarningAlert` (rename `<WarningAlert>` to
  `<StatusAlert tone="warning">`): every notice tints the whole card in its
  tone, so an error reads like a warning, only red, with title and description
  in the text colours. `StatusBadge` marks a state (Paid, Pending, Failed) with
  its tone's wash and a coloured dot. Both share Callout's tones (`lib/tone.ts`);
  the contrast check covers each tone's icon and dot on its wash.
- `Delta` writes its figure in the text colour with a `+` or `−` sign, and only a
  small trend icon is green or red (was a coloured ▲/▼ and coloured figure).
  Treemap labels and its legend use the sign too.
- Contrast fixes from a measured light and dark review (WCAG 1.4.3 text 4.5:1,
  1.4.11 marks 3:1):
  - Focus is visible wherever the ring was the only sign of it: toggles, a
    calendar day and a scroll area take an opaque `--ring`; the slider's thumb
    now shows its hidden input's keyboard focus (it showed none); a destructive
    control focuses, and an invalid field is edged, in the full destructive red.
  - `--destructive` is its own colour, deeper than the loss red `--negative`:
    light `oklch(0.49 0.19 27.325)`, dark `oklch(0.8 0.1 22.216)`, so a delete
    button's label reaches 4.5:1 on its tint and on hover.
  - Light `--muted-foreground` is `oklch(0.51 0 0)` (was `0.556`), 4.5:1 on the
    muted fill and every Callout, WarningAlert and Quote wash.
  - `--input` is a field's edge at 3:1: light `oklch(0.64 0 0)`, dark
    `oklch(0.62 0 0)` (was a faint grey and 15% white). Inputs, textareas,
    selects, input groups and the command search take it; buttons, toggles and
    code blocks keep the faint `--border` outline. The command search gets the
    muted placeholder and a muted fill. A slider's track is outlined in it.
  - A selected pill tab fills with the foreground, as a selected toggle does.
  - A chart bar dimmed by a selection, and a DistributionBar segment faded by
    `highlighted`, keep a full-colour outline and fade only inside.
  - Dark `--positive` is `oklch(0.69 0.16 151.711)` (was `0.74`), so a
    treemap's deepest green tile keeps its label at 4.5:1. Light `--chart-4`
    is `oklch(0.65 0.11 235)`, 3:1 on the canvas as well as the card.
  - Meaning colours sit inside sRGB: light positive, negative and warning and
    dark negative, warning and link lose a little chroma.
  - `siyahi-contrast` checks 160 pairs (was 64): every pair on the canvas and
    the card, translucent tints blended over them, the tints above, field
    edges, the focus ring, selected tabs, treemap heat steps, and every colour's
    gamut.
- Corners are shadcn's "small" radius, `--radius: 0.45rem` (was `0.625rem`):
  cards round at 10px (was 14px), buttons and inputs at 7px (was 10px).
- Lint: `siyahi/no-restyle` (shadcn's `no-restyle`) rejects classes that change
  a component's spacing, colour, shape or type; pages may only place it. Add
  `"siyahi/no-restyle": "error"` to an app's oxlint rules. The catalogue's
  examples now style plain wrappers instead of the components.
- The catalogue reads as a design system for any data-heavy app: its examples,
  captions and rules use sales, traffic, uptime, budgets, orders and support
  tickets instead of one stock portfolio. `DESIGN.md` names a team, a region or
  a product line as its neutral categories. The example `chart-bar-sectors` is
  now `chart-bar-teams`.
- Design review batch (#57), from ten rounds of independent design reviews:
  - Tables fit their width: columns marked `meta.compact` stay and the rest
    hide from the right behind `DataTableCompactColumnsToggle` ("All columns
    (+N)"), read from `useDataTable().compactColumns`. Number columns
    right-align; the pinned column is a hairline; a sideways-scrolling table
    fades at its edge.
  - Charts write every axis tick in the largest tick's unit (₹1.6L to ₹0.4L,
    not ₹80,000 halfway up) and step ticks by 1, 2, 2.5 or 5 x 10^n.
    `yTickFormatter` now receives the axis scale as a second argument, which
    `moneyCompact` uses. Gain and loss bars are a tint inside a full-colour
    edge; area fills fade to the axis; lines and areas end in a dot on the
    latest value; sparklines draw their run grey and ink only the last step.
  - Theme: an ink-indigo accent placed on links, focus, the selected sidebar
    item and `chart-1`; the dark chart palette keeps indigo saturated; dark
    muted text is a step brighter. The default surface is `card`.
  - New: `ChangeBar` with `DataTableFootnote`, `TargetRows`, `RangePosition`,
    `PageHero`, `PageToc`, `WarningAlert`, `Callout` and `Quote`,
    `defaultSidebarOpen`. A warning or callout is tinted across the whole box;
    the skill rules out one-sided coloured edges.
  - Heatmap blocks take `selected` (a ring and `aria-pressed`) and fill their
    card with a unit legend. Treemap hides labels that do not fit, and reports
    `onHover` only for a mouse, so a tap selects instead of opening a hover
    card. BarList labels sit on a full-width track.
  - The catalogue indexes each category as family cards with live previews;
    each family page leads with its example, then the import line, a props
    table and rules. Cmd/Ctrl+K searches it.

- `AppSidebar` reaches the bottom of the screen on a phone in landscape. Core
  sized the fixed sidebar with `h-svh`, the height with the browser's bars
  shown, so it stopped short once Safari hid them; it now passes `h-auto` and
  lets `inset-y-0` size it. Shipped in `0.1.9-next.20`.
- The compact table-filter example keeps search on its own full-width row on
  phones, leaving room to type beside the secondary filter controls.
- The public `siyahi` skill guides agents through the installed package's
  generated component index and catalogue examples. The package ships those
  examples and the report layout rules, so discovery needs no local checkout.
- Ruled `PanelGrid` clips its edge hairlines without trapping sticky children;
  a detail card beside a long list can stick while the page scrolls.
- All series chart cards accept category `xTicks` typed to `xKey`: label selected
  categories while keeping every row plotted and available in the tooltip.
- `siyahi-shots` ignores intentionally clipped, aria-hidden form controls such as
  Base UI Select inputs, while still checking visible controls and descendants.

- Table filter dropdowns grow to fit full option names, stay within the viewport,
  and wrap long labels while keeping checkboxes and counts visible.
- Bar charts select the entire highlighted category area, including zero-height bars.

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
- A chart card draws every tick a page names in `xTicks`, the ones at both ends
  of `xDomain` included: Recharts' default dropped a label it thought would
  overflow, so the Dell page lost its first one. Crowded labels squeeze to
  their column instead, and the plot keeps room on the right for the last.
- A `BarChartCard` series whose bars are all below zero, rows with no value
  aside, shows its `negativeColor` in the legend too, and bar paths no longer
  carry `name="undefined"`.
- A `SectionCards` headline wraps rather than clipping to one line on a phone.
- A `BarChartCard`'s value axis always reaches zero. With no value above zero,
  unstacked, Recharts fitted the axis to the data, so a series of losses hung
  from the smallest one; The Book stacked its one series to get round it.
- The raw Recharts exports (`Area`, `AreaChart`, `Bar`, `BarChart`,
  `CartesianGrid`, `Line`, `LineChart`, `ReferenceLine`, `XAxis`, `YAxis`) are
  gone. Pages draw charts with `BarChartCard`, `AreaChartCard`,
  `LineChartCard` and `DistributionBar`; dash's pages, the Dell page included,
  and The Book moved to them on `0.1.9-next.2` (dash#95, The Book #34). This
  resolves the dated notes under 0.1.8 and, in this section, under 0.1.9. A page
  that still needs a raw part imports `recharts` from its own dependency.
- `NavMain` and `AppSidebar` require an `icon` on every nav item. The sidebar
  collapses to a strip one icon wide, and an item without an icon showed the
  first letters of its title cut off; an app that left one out now fails to
  typecheck instead.
- `Sparkline`, from dashboardcn's `sparkline`: a small line or area chart with
  no axes, in a chart token or a meaning colour. Its hidden value axis fits the
  data, so a run from ₹38L to ₹45L shows its shape instead of a flat line.
- `MetricStrip`, from dashboardcn's `kpi-row-card`: one card holding a row of
  small figures, each with a `Delta` and a sparkline coloured by the change's
  sign. Rules part the tiles; the columns follow the count, two to a row on a
  phone and up to eight on a wide card.
- `DataBar`: a table cell's figure behind a short bar, its length the figure's
  share of the column's largest, in `--chart-1` or by sign. It sits on the
  figure's line, so the row keeps its height.
- A `SectionCards` tile takes `trend`, a small chart such as a `Sparkline`
  between the figure and the footer lines.
- Core components are shadcn's `base-nova` style instead of `base-luma`: the
  flat, compact one. Cards pad 16px (was 24px) with 14px corners and a 1px
  ring, no `shadow-md`, and a footer drawn as a tinted band; table headers are
  `h-10` and cells `p-2`, so a one-line row is 36px (was 44px), the data table
  included; buttons are 32px (`sm` 28px, `lg` 36px, icon 32px) with rounded
  corners instead of pills. The theme, Geist, the chart palette and the
  meaning colours are unchanged. The highlighter hook shadcn adds with the code
  block is left out again, so `shiki` is not a dependency.
- Surfaces: `SiyahiProvider` takes `surface`. `"ruled"`, the default, takes
  the box off every `Card` (fill, corner, ring and the footer band) on the
  page, in dash and The Book too with no change on their side; `"open"` also
  drops its padding, so a block's content sits level with the page's text;
  `"card"` gives Nova's card back. A nested provider sets it for one part of a
  page. A picked `SectionCards` tile keeps its ring on every surface.
- `PanelGrid`: data blocks side by side, one to four across, with a hairline
  between them and a rule above and below on a ruled page, whitespace on an
  open one and a gap between boxes on a card one.
- Dark scheme, for readability: the canvas is `#121212` (was `#0a0a0a`) and
  text `#e5e5e5` (was `#fafafa`), 14.9:1 rather than 19:1, which blurs for
  many readers once the cards' grey no longer sits behind the text. Cards and
  popovers match the canvas; the sidebar is a shade darker (`#0a0a0a`).
  Muted text is 7.3:1, every meaning colour at least 6.5:1 and every chart
  colour at least 3.4:1. The light scheme is unchanged.
- On a ruled page `SectionCards` parts its tiles with hairlines across and
  down, with a rule above and below the row, as `PanelGrid` parts blocks;
  boxless, the tiles had floated as loose figures. A picked tile's ring sits
  inside the tile there.
- `SectionCards` draws those rules on a `div` around each tile, as
  `PanelGrid` does, instead of on the `Card`. The Card had been shifted 1px
  to hide its outer rule, which started the first tile 1px into the page's
  gutter and failed `siyahi-shots` at 390 wide on every page with stat tiles
  (siyahi#34). Tiles in a row still share one height.
- `SectionCards` tiles are compact: 12px in from each edge instead of 16px,
  a 24px figure at every width instead of 30px on a wide tile, and 4px
  between the footer lines instead of 6px.
- `PageSection` is denser: 24px under its rule instead of 40px, 16px from the
  heading to the content instead of 24px, and a 20px title instead of 24px.
  Stack sections 24px apart (`gap-6`) so the rule sits midway. On an open
  surface `PanelGrid` leaves 32px across and 24px down between blocks,
  instead of 40px and 32px.
- On ruled and open pages a card's footer has no top padding: Nova's footer
  pads itself for the tinted band those pages drop, and the padding stacked
  on the card's gap, leaving a hole between a tile's figure and its lines.
- `MetricStrip` takes its box off with every other card on a ruled page: its
  `data-slot` moved from the `Card`, where it replaced the card's own, to the
  strip inside it.
- Both packages publish through npm trusted publishing, with provenance: npm
  shows which commit and workflow run built each version. No npm token is
  stored anywhere.

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
