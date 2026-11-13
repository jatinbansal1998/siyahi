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
// columns follow the count, parted by space (24px across, 20px down), each
// figure's text in line with the title above it. The sparkline always sits
// under the figure at the figure's full width, on the foot of its row, so a
// row of figures reads as aligned columns rather than charts beside some
// figures, under others, and lower where a note took a second line.
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
}

// Tailwind finds classes by scanning source, so each step is written out whole. A figure stays at least about 150px
// wide, room for ₹45,12,300 at text-xl, and up to eight figures, none sits alone under a full row: five run 3 + 2
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

function trendColor(change: number | undefined): ChartColor {
  if (change === undefined) return "var(--chart-1)"
  if (change > 0) return "var(--positive)"
  if (change < 0) return "var(--negative)"
  return "var(--muted-foreground)"
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
  className,
  ...props
}: MetricStripProps) {
  const columns = COLUMNS[Math.min(items.length, 8)] ?? COLUMNS[8]
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
        <div data-slot="metric-strip" className="@container/strip">
          <div className={cn("grid grid-cols-1 gap-x-6 gap-y-5", columns)}>
            {items.map((item) => (
              <div
                key={item.label}
                data-slot="metric-strip-item"
                data-tone={item.tone}
                data-stale={item.stale ? "" : undefined}
                data-picked={onSelect && item.label === selected ? "" : undefined}
                className={cn("relative flex min-w-0 flex-col gap-1", onSelect && item.disabled && "opacity-60")}
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
                {/*
                 * The stale note shares the label's line, a fixed 16px its boxed note centres on, so a stale figure's value
                 * stays level with its neighbours'.
                 */}
                <div className="flex h-4 min-w-0 items-center gap-2">
                  <div
                    data-slot="metric-strip-label"
                    className="truncate font-mono text-2xs tracking-wider text-muted-foreground uppercase"
                  >
                    {item.label}
                  </div>
                  {item.stale && <StaleNote since={item.stale} />}
                </div>
                <div data-slot="metric-strip-value" className="text-xl font-semibold tracking-tight tabular-nums">
                  {item.value}
                </div>
                {(item.change !== undefined || item.note) && (
                  <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                    {item.change !== undefined && <Delta value={item.change} format={item.changeFormat} />}
                    {item.note && <span className="text-muted-foreground">{item.note}</span>}
                  </div>
                )}
                {item.trend && item.trend.length > 1 && (
                  <Sparkline data={item.trend} variant="line" color={trendColor(item.change)} className="mt-auto h-8 w-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      {footer && <CardFooter className="flex-col items-start gap-2 text-sm">{footer}</CardFooter>}
    </Card>
  )
}

export { MetricStrip }
