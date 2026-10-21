// Registry: @shadcn/chart-bar-multiple
// Origin: https://ui.shadcn.com/r/styles/new-york-v4/chart-bar-multiple.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-21, sha256 46fbdcf8c66b0def3836211e4e186eb3777b3daaca3b09dc6f94eb82ccc86309
// Siyahi edit: the sample data, config and footer are replaced by props, so a
// page passes rows and series and never puts Recharts parts together itself.
// Siyahi edit: the card, axes, dashed grid, tooltip and legend come from
// lib/chart-frame, shared with AreaChartCard and LineChartCard. The axes keep
// Recharts' default ids, which a page can no longer change (dash#88).
// Siyahi edit: bars are grouped, or stacked with `stacked`; a stack rounds
// only its top, so the series meet flush.
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
"use client"

import { Bar, BarChart } from "recharts"

import { ChartFrame } from "@siyahi/ui/lib/chart-frame"
import type { SeriesChartProps } from "@siyahi/ui/lib/chart-series"

export interface BarChartCardProps<T extends object, K extends keyof T>
  extends SeriesChartProps<T, K> {
  /** Stack the series in one bar per point instead of side by side. */
  stacked?: boolean
}

/** Values over an ordered axis as bars: one series, or several grouped or stacked. */
export function BarChartCard<T extends object, K extends keyof T>({
  stacked = false,
  ...props
}: BarChartCardProps<T, K>) {
  return (
    <ChartFrame chart={BarChart} {...props}>
      {props.series.map(({ key, color }, index) => (
        <Bar
          key={key}
          dataKey={key}
          fill={color}
          stackId={stacked ? "stack" : undefined}
          radius={
            !stacked ? 2 : index === props.series.length - 1 ? [2, 2, 0, 0] : 0
          }
        />
      ))}
    </ChartFrame>
  )
}
