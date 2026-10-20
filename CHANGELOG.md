# Changelog

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
