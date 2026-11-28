// Registry: @dashboardcn/kpi-row-card
// Origin: https://dashboardcn.com/r/kpi-row-card.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-26, sha256 b49fa95b3efa19086b3df2e3a18f6a0d5a95204951448c5d93fc41c2bdb6326f
// Siyahi edit: named MetricStrip, the design's name for a row of figures,
// with its metrics as `items`. It is the package's one row of figures: it
// took over shadcn dashboard-01's SectionCards (the stat tile row), whose
// picker, disabled tiles and stale marks it carries, so a page has one way
// to show a run of figures (siyahi, density rework).
// Siyahi edit: the page formats each value, so a figure follows the
// SiyahiProvider locale; dashboardcn's MetricValue and en-US lib/format are
// not copied. A change is a Delta (a signed figure with a coloured trend icon), instead of
// DeltaBadge, and its sign colours the sparkline in --positive or --negative
// instead of Tailwind's emerald and red.
// Siyahi edit: the period switcher is the page's `action`, a ToggleGroup as
// on the chart cards, instead of dashboardcn's PeriodTabs; the footer link and
// the per-metric icon are dropped, and the theme's narrow-card rule places the
// header action, so the header's own @max-sm overrides go.
// Siyahi edit: no box, no rule. Figures sit on the page in a grid whose
// columns follow the count, parted by 16px of space, which two figures' 8px washes just fill, each
// figure's text in line with the title above it. Each figure is a subgrid of
// four shared rows (label, value, change, sparkline), so a label or note that
// wraps lowers its row for the whole row of figures: every value and
// sparkline stays level, and a label wraps rather than being cut short.
// Siyahi edit: the title is optional, for a strip of figures heading a page.
// Siyahi edit: each figure's label is small monospaced capitals.
// Siyahi edit: `tone` marks a figure as the exception: the theme washes it in
// the tone and outlines it, the wash reaching 8px past the figure so its text
// stays in line with its neighbours'. `stale` greys a figure and notes since
// when. Both are the page's call, never inferred.
// Siyahi edit: `selected` and `onSelect` make the figures a picker, such as
// one per sales channel that scopes the page: a button laid over each figure
// carries aria-pressed, the picked one takes an outline, and a disabled one
// fades and cannot be picked.
// Siyahi edit: `variant="blocks"` sets the figures as a page's headline: each on
// a solid block (the headline orange, the text colour, a grey, in turn), the
// blocks touching, the value large, no sparkline and no tone wash.
// Siyahi edit: `variant="lead"` sets one figure as the number a page is about,
// large in the text colour on the open page, with one or two supporting
// figures beside it at strip size; no block, sparkline or tone.
// Siyahi edit: `rise: "bad"` on a figure says a rise is bad news (a cost, a
// debt, a fear gauge), so its Delta and sparkline take the loss colour on a rise.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
import * as React from "react"

import { cn } from "@siyahi/ui/lib/utils"
import type { ChartColor } from "@siyahi/ui/lib/chart-series"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siyahi/ui/components/ui/card"
import { Delta } from "@siyahi/ui/components/siyahi/delta"
import { StaleNote } from "@siyahi/ui/components/siyahi/stale-note"
import { Sparkline } from "@siyahi/ui/components/registry/dashboardcn/sparkline"

export interface MetricStripItem {
  /** Small capital label above the figure; it also names the figure's button in a picker. */
  label: string
  /** The figure, formatted by the page: money(4512300). */
  value: React.ReactNode
  /** The signed change, drawn as a Delta under the figure; its sign colours the trend. For "pct", a fraction. */
  change?: number | undefined
  changeFormat?: "pct" | "money" | undefined
  /** Whether a rise is good news, the default, or bad, as for costs or debt: "bad" swaps the change's colours. */
  rise?: "good" | "bad" | undefined
  /** Muted words after the change, such as "vs last month", or what the figure covers. */
  note?: React.ReactNode
  /** Recent values, oldest first, drawn as a sparkline under the figure. */
  trend?: number[] | undefined
  /** Marks the figure as the exception on the page: a faint wash of the colour and an outline of it. */
  tone?: "negative" | "warning" | undefined
  /** Marks the figure's data as old, with since when, such as "3 Nov": it greys out and says so. */
  stale?: React.ReactNode
  /** In a picker, a figure that cannot be picked, such as one with nothing in it: faded, its button disabled. */
  disabled?: boolean | undefined
}

export interface MetricStripProps extends Omit<React.ComponentProps<typeof Card>, "title" | "onSelect"> {
  title?: React.ReactNode
  description?: React.ReactNode
  /** A range toggle, top right, that changes every figure. */
  action?: React.ReactNode
  items: MetricStripItem[]
  /** Lines under the strip, such as what the figures cover. */
  footer?: React.ReactNode
  /** The label of the picked figure. */
  selected?: string | undefined
  /** Makes each figure one button, so keep figure content non-interactive; gets the label of the figure picked. */
  onSelect?: ((label: string) => void) | undefined
  /**
   * "strip", the default: figures on the page with their sparklines. "blocks": the page's headline, two to four
   * figures each on a solid block with a large value; it draws no sparkline and no tone, so mark an exception in a
   * strip below it. "lead": the number the page is about, the first figure, large in the text colour with no box,
   * and up to two supporting figures beside it; no sparkline and no tone. One headline per page, blocks or lead.
   */
  variant?: "strip" | "blocks" | "lead" | undefined
}

// Tailwind finds classes by scanning source, so each step is written out whole. A figure stays at least about 150px
// wide, room for ₹45,12,300 at text-lg, and up to eight figures, none sits alone under a full row: five run 3 + 2
// and seven 4 + 3 rather than leave one under pairs.
const COLUMNS: Record<number, string> = {
  1: "",
  2: "@2xs/strip:grid-cols-2",
  3: "@lg/strip:grid-cols-3",
  4: "@2xs/strip:grid-cols-2 @3xl/strip:grid-cols-4",
  5: "@lg/strip:grid-cols-3 @3xl/strip:grid-cols-5",
  6: "@2xs/strip:grid-cols-2 @xl/strip:grid-cols-3 @5xl/strip:grid-cols-6",
  7: "@2xl/strip:grid-cols-4 @7xl/strip:grid-cols-7",
  8: "@2xs/strip:grid-cols-2 @3xl/strip:grid-cols-4 @7xl/strip:grid-cols-8",
}

type Role = "strip" | "blocks" | "lead" | "supporting"

const VALUE_SIZE: Record<Role, string> = {
  strip: "text-lg tracking-tight",
  blocks: "mt-2 text-4xl leading-none tracking-tighter",
  // Sized by the strip's width, so sixteen characters (₹12,45,23,800.50) fit a phone; a longer figure breaks rather
  // than push the page sideways.
  lead: "text-[length:clamp(1.5rem,10cqi,3rem)] leading-tight wrap-anywhere",
  supporting: "text-lg tracking-tight",
}

function trendColor({ change, rise = "good" }: MetricStripItem): ChartColor {
  if (change === undefined) return "var(--chart-1)"
  if (change === 0) return "var(--muted-foreground)"
  return change > 0 === (rise === "good") ? "var(--positive)" : "var(--negative)"
}

/** A row of figures, each with its change and recent run, optionally a picker that scopes the page. */
function MetricStrip({
  title,
  description,
  action,
  items,
  footer,
  selected,
  onSelect,
  variant = "strip",
  className,
  ...props
}: MetricStripProps) {
  const strip = variant === "strip"
  const figure = (item: MetricStripItem, role: Role) => (
    <div
      key={item.label}
      data-slot="metric-strip-item"
      data-lead={role === "lead" ? "" : undefined}
      data-tone={strip ? item.tone : undefined}
      data-stale={item.stale ? "" : undefined}
      data-picked={onSelect && item.label === selected ? "" : undefined}
      // Each figure takes four rows of the strip's grid (label, value, change, sparkline) as a subgrid, so a label or
      // note that wraps in one figure lowers that row for its neighbours too and every part stays level. Blocks and a
      // lead have no sparkline, so three.
      className={cn(
        "relative grid min-w-0 grid-rows-subgrid gap-y-1",
        strip ? "row-span-4" : "row-span-3",
        role === "blocks" && "p-4",
        onSelect && item.disabled && "opacity-60",
      )}
    >
      {/* The figure is a div, which a button cannot hold, so the button lies over it, out to the wash's edge. */}
      {onSelect && (
        <button
          type="button"
          aria-label={item.label}
          aria-pressed={item.label === selected}
          disabled={item.disabled}
          onClick={() => onSelect(item.label)}
          className="absolute -inset-2 z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div
        data-slot="metric-strip-label"
        className="font-mono text-2xs tracking-wider break-words text-muted-foreground uppercase"
      >
        {item.label}
      </div>
      <div data-slot="metric-strip-value" className={cn("font-semibold tabular-nums", VALUE_SIZE[role])}>
        {item.value}
      </div>
      {/* The change's line, which may wrap, also holds the stale note, so the label is never cut short. A lead's runs
          on as a sentence, so a long note wraps after the change rather than leave it alone on its line. */}
      <div
        className={cn(
          "self-start",
          role === "lead"
            ? "text-sm [&>*+*]:ms-1.5"
            : "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs",
        )}
      >
        {item.change !== undefined && <Delta value={item.change} format={item.changeFormat} rise={item.rise} />}
        {item.note && <span className="text-muted-foreground">{item.note}</span>}
        {item.stale && <StaleNote since={item.stale} />}
      </div>
      {strip &&
        (item.trend && item.trend.length > 1 ? (
          <Sparkline data={item.trend} variant="line" color={trendColor(item)} className="mt-1 h-8 w-full" />
        ) : (
          <div />
        ))}
    </div>
  )
  const [first, ...rest] = items
  return (
    <Card className={cn("gap-4", className)} {...props}>
      {(title || description || action) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent>
        <div data-slot="metric-strip" data-variant={variant} className="@container/strip">
          {variant === "lead" ? (
            // The supporting figures sit beside the lead, level with its foot, while they fit there, and under it
            // when they do not; they keep their own row of figures, so a note that wraps lowers its neighbour's too.
            <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
              {first && <div className="grid min-w-0">{figure(first, "lead")}</div>}
              {rest.length > 0 && (
                <div className="grid min-w-0 auto-cols-fr grid-flow-col gap-x-8">
                  {rest.map((item) => figure(item, "supporting"))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1",
                strip ? "gap-4" : "gap-0",
                COLUMNS[Math.min(items.length, 8)] ?? COLUMNS[8],
              )}
            >
              {items.map((item) => figure(item, variant))}
            </div>
          )}
        </div>
      </CardContent>
      {footer && <CardFooter className="flex-col items-start gap-2 text-sm">{footer}</CardFooter>}
    </Card>
  )
}

export { MetricStrip }
