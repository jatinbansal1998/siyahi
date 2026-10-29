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
// Siyahi edit: a series' negativeColor colours its bars below zero, with one
// Cell per row as shadcn's chart-bar-negative does.
// Siyahi edit: selected and onSelect pick a category;
// the other bars fade, as shadcn's chart-bar-active marks its bar.
// Siyahi edit: the entire tooltip category selects, including empty space around a bar.
// Siyahi edit: horizontal lays the bars sideways, categories down the left,
// as shadcn's chart-bar-horizontal does, for long names such as sectors.
// Siyahi edit: a stack runs negative values down from zero and positive ones
// up, so money out sits below the line rather than hanging from money in.
// Siyahi edit: a series whose bars are all below zero takes its negativeColor
// as the Bar's fill, so its legend chip matches the bars; each Bar is named
// after its series, so no bar path carries name="undefined".
// Siyahi edit: the value axis reaches zero when no value is above it, so a
// series of losses runs down from zero unstacked too.
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
"use client"

import { Bar, BarChart, Cell, type YAxisProps } from "recharts"

import { ChartFrame, seriesFill } from "@siyahi/ui/lib/chart-frame"
import type { SeriesChartProps } from "@siyahi/ui/lib/chart-series"

export interface BarChartCardProps<T extends object, K extends keyof T>
  extends SeriesChartProps<T, K> {
  /** Stack the series in one bar per point instead of side by side. */
  stacked?: boolean
  /** Bars run sideways, categories down the left: for long names, such as sectors. */
  horizontal?: boolean
  /** The picked category's x value: its bars stay solid and the rest fade. */
  selected?: T[K] | null
  /** Called with a clicked category's x value, or null when the picked one is clicked again. */
  onSelect?: (value: T[K] | null) => void
}

// Recharts' value axis defaults to [0, "auto"], which reaches zero only from above:
// with no value above zero it falls back to the data's range, and the bars hang
// from the smallest loss. "auto" keeps its rounded ticks.
const DOWN_FROM_ZERO: YAxisProps["domain"] = ["auto", 0]

/** Values over an ordered axis as bars: one series, or several grouped or stacked. */
export function BarChartCard<T extends object, K extends keyof T>({
  stacked = false,
  selected = null,
  onSelect,
  ...props
}: BarChartCardProps<T, K>) {
  return (
    <ChartFrame
      chart={BarChart}
      {...props}
      yDomain={
        props.yDomain ??
        (props.data.some((row) => props.series.some(({ key }) => Number(row[key as keyof T]) > 0))
          ? undefined
          : DOWN_FROM_ZERO)
      }
      stackOffset={stacked ? "sign" : undefined}
      onClick={
        onSelect
          ? ({ activeTooltipIndex, isTooltipActive }) => {
              if (!isTooltipActive || activeTooltipIndex == null) return
              const row = props.data[Number(activeTooltipIndex)]
              if (row) onSelect(row[props.xKey] === selected ? null : row[props.xKey])
            }
          : undefined
      }
    >
      {props.series.map((item, index) => {
        const { key, label, color, negativeColor } = item
        return (
          <Bar
            key={key}
            dataKey={key}
            name={label}
            fill={seriesFill(item, props.data)}
            stackId={stacked ? "stack" : undefined}
            radius={
              !stacked
                ? 2
                : index === props.series.length - 1
                  ? props.horizontal
                    ? [0, 2, 2, 0]
                    : [2, 2, 0, 0]
                  : 0
            }
          >
            {(negativeColor || selected !== null) &&
              props.data.map((row, i) => (
                <Cell
                  key={i}
                  fill={
                    negativeColor && Number(row[key as keyof T]) < 0
                      ? negativeColor
                      : color
                  }
                  fillOpacity={
                    selected === null || row[props.xKey] === selected ? 1 : 0.35
                  }
                />
              ))}
          </Bar>
        )
      })}
    </ChartFrame>
  )
}
