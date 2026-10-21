// Registry: @shadcn/chart-line-multiple
// Origin: https://ui.shadcn.com/r/styles/new-york-v4/chart-line-multiple.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-21, sha256 20c708ac3e313e275a84119970b6046142f24c869a9355caec5483aa4feb6ddd
// Siyahi edit: the sample data, config and footer are replaced by props, so a
// page passes rows and series and never puts Recharts parts together itself.
// Siyahi edit: the card, axes, dashed grid, tooltip and legend come from
// lib/chart-frame, shared with BarChartCard and AreaChartCard. The axes keep
// Recharts' default ids, which a page can no longer change (dash#88).
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
"use client"

import { Line, LineChart } from "recharts"

import { ChartFrame, seriesEntries } from "@siyahi/ui/lib/chart-frame"
import type { SeriesChartProps } from "@siyahi/ui/lib/chart-series"

/** Values over an ordered axis as lines: one series, or several to compare, such as a portfolio against its index. */
export function LineChartCard<T extends object, K extends keyof T>(
  props: SeriesChartProps<T, K>
) {
  return (
    <ChartFrame chart={LineChart} {...props}>
      {seriesEntries(props.series).map(([key, item]) => (
        <Line
          key={key}
          dataKey={key}
          type="monotone"
          stroke={item.color}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </ChartFrame>
  )
}
