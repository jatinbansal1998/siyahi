// Registry: @shadcn/chart-area-stacked
// Origin: https://ui.shadcn.com/r/styles/new-york-v4/chart-area-stacked.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-21, sha256 d65dbe0690431811cfb4c1117506b6ff4c411eb65db70c29c97cca1030abb0b5
// Siyahi edit: the sample data, config and footer are replaced by props, so a
// page passes rows and series and never puts Recharts parts together itself.
// Siyahi edit: the card, axes, dashed grid, tooltip and legend come from
// lib/chart-frame, shared with BarChartCard and LineChartCard. The axes keep
// Recharts' default ids, which a page can no longer change (dash#88).
// Siyahi edit: areas overlap by default, each drawn over the one before;
// `stacked` stacks them as the block does. Curves are monotone, not natural,
// so a curve never overshoots past a data point.
// Siyahi edit: xDomain and xTicks make the x axis numeric, so a mark can sit
// between two samples, as the Dell page's events do between 15 s samples.
// Siyahi edit: curve picks monotone or straight edges (chart-area-linear).
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
"use client"

import { Area, AreaChart } from "recharts"

import { ChartFrame } from "@siyahi/ui/lib/chart-frame"
import type {
  ChartCurve,
  NumericXProps,
  SeriesChartProps,
} from "@siyahi/ui/lib/chart-series"

export interface AreaChartCardProps<T extends object, K extends keyof T>
  extends SeriesChartProps<T, K>,
    NumericXProps {
  /** Stack the series into a total instead of overlapping them. */
  stacked?: boolean
  curve?: ChartCurve
}

/** Values over an ordered axis as filled areas: one series, or several overlapping or stacked. */
export function AreaChartCard<T extends object, K extends keyof T>({
  stacked = false,
  curve = "monotone",
  ...props
}: AreaChartCardProps<T, K>) {
  return (
    <ChartFrame chart={AreaChart} {...props}>
      {props.series.map(({ key, color }) => (
        <Area
          key={key}
          dataKey={key}
          type={curve}
          fill={color}
          fillOpacity={stacked ? 0.4 : 0.2}
          stroke={color}
          stackId={stacked ? "stack" : undefined}
        />
      ))}
    </ChartFrame>
  )
}
