# Changelog

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
