// Registry: @dashboardcn/kpi-row-card
// Origin: https://dashboardcn.com/r/kpi-row-card.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-26, sha256 b49fa95b3efa19086b3df2e3a18f6a0d5a95204951448c5d93fc41c2bdb6326f
// Siyahi edit: named MetricStrip, the design's name for a row of figures in
// one card, with its metrics as `items`, as SectionCards takes them.
// Siyahi edit: the page formats each value, so a figure follows the
// SiyahiProvider locale; dashboardcn's MetricValue and en-US lib/format are
// not copied. A change is a Delta, ▲ or ▼ in a meaning colour, instead of
// DeltaBadge, and its sign colours the sparkline in --positive or --negative
// instead of Tailwind's emerald and red.
// Siyahi edit: the period switcher is the page's `action`, a ToggleGroup as
// on the chart cards, instead of dashboardcn's PeriodTabs; the footer link and
// the per-metric icon are dropped, and the theme's narrow-card rule places the
// header action, so the header's own @max-sm overrides go.
// Siyahi edit: tiles wrap onto rows, the column steps following the tile
// count as SectionCards' do, with a rule between tiles across and down. The
// rules sit on each tile's left and top edge, and the strip clips the ones on
// its own edges, so they stay right on every row whatever the count.
// Siyahi edit: the title is optional, for a strip of figures heading a page.
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
import { Sparkline } from "@siyahi/ui/components/registry/dashboardcn/sparkline"

export interface MetricStripItem {
  /** Muted label above the figure. */
  label: string
  /** The figure, formatted by the page: money(4512300). */
  value: React.ReactNode
  /** The signed change, drawn as a Delta under the figure; its sign colours the trend. For "pct", a fraction. */
  change?: number
  changeFormat?: "pct" | "money"
  /** Muted words after the change, such as "vs last month". */
  note?: React.ReactNode
  /** Recent values, oldest first, drawn as a sparkline beside the figure. */
  trend?: number[]
}

export interface MetricStripProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title?: React.ReactNode
  description?: React.ReactNode
  /** A range toggle, top right, that changes every figure. */
  action?: React.ReactNode
  items: MetricStripItem[]
  /** Lines under the strip, such as what the figures cover. */
  footer?: React.ReactNode
}

// Tailwind finds classes by scanning source, so each step is written out whole.
// A tile stays at least about 150px wide, room for ₹45,12,300 at text-xl.
const COLUMNS: Record<number, string> = {
  1: "basis-full",
  2: "basis-full @2xs/strip:basis-1/2",
  3: "basis-full @lg/strip:basis-1/3",
  4: "basis-full @2xs/strip:basis-1/2 @3xl/strip:basis-1/4",
  5: "basis-full @2xs/strip:basis-1/2 @3xl/strip:basis-1/5",
  6: "basis-full @2xs/strip:basis-1/2 @xl/strip:basis-1/3 @5xl/strip:basis-1/6",
  8: "basis-full @2xs/strip:basis-1/2 @3xl/strip:basis-1/4 @7xl/strip:basis-1/8",
}

function trendColor(change: number | undefined): ChartColor {
  if (change === undefined) return "var(--chart-1)"
  if (change > 0) return "var(--positive)"
  if (change < 0) return "var(--negative)"
  return "var(--muted-foreground)"
}

/** A card holding a row of small figures, each with its change and a sparkline: more numbers in less room than stat tiles. */
function MetricStrip({
  title,
  description,
  action,
  items,
  footer,
  className,
  ...props
}: MetricStripProps) {
  const columns = COLUMNS[Math.min(items.length, 8)] ?? COLUMNS[8]
  return (
    <Card data-slot="metric-strip" className={cn("gap-4", className)} {...props}>
      {(title || description || action) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent>
        <div className="@container/strip -mx-4 -my-3 overflow-hidden">
          <div className="-mt-px -ml-px flex flex-wrap">
            {items.map((item) => (
              <div
                key={item.label}
                data-slot="metric-strip-item"
                className={cn("flex min-w-0 flex-col gap-1 border-t border-l px-4 py-3", columns)}
              >
                <div className="truncate text-xs text-muted-foreground">{item.label}</div>
                <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="text-xl font-semibold tracking-tight tabular-nums">{item.value}</div>
                    {(item.change !== undefined || item.note) && (
                      <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                        {item.change !== undefined && <Delta value={item.change} format={item.changeFormat} />}
                        {item.note && <span className="text-muted-foreground">{item.note}</span>}
                      </div>
                    )}
                  </div>
                  {item.trend && item.trend.length > 1 && (
                    <Sparkline
                      data={item.trend}
                      variant="line"
                      color={trendColor(item.change)}
                      className="h-8 w-16 shrink-0"
                    />
                  )}
                </div>
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
