// Registry: @shadcn/chart-area-stacked
// Origin: https://ui.shadcn.com/r/styles/new-york-v4/chart-area-stacked.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-21, sha256 d65dbe0690431811cfb4c1117506b6ff4c411eb65db70c29c97cca1030abb0b5
// Siyahi edit: the sample data, config and footer are replaced by props, so a
// page passes rows and series and never puts Recharts parts together itself.
// Siyahi edit: the card, axes, solid grid, tooltip and legend come from
// lib/chart-frame, shared with BarChartCard and LineChartCard. The axes keep
// Recharts' default ids, which a page can no longer change (dash#88).
// Siyahi edit: areas overlap by default, each drawn over the one before;
// `stacked` stacks them as the block does. Curves are monotone, not natural,
// so a curve never overshoots past a data point.
// Siyahi edit: overlapping areas are not filled at all, since fills bury each
// other from three series on; a stacked area fills each band with a flat tint
// of its colour, no gradient. Lines are 2px; each ends in a dot on its latest
// point.
// Siyahi edit: overlapping areas are named at their line ends, take quiet
// series, forecastFrom and today, and draw in, as LineChartCard does.
// Siyahi edit: xDomain and xTicks make the x axis numeric, so a mark can sit
// between two samples, as the Dell page's events do between 15 s samples.
// Siyahi edit: curve picks monotone or straight edges (chart-area-linear).
// Siyahi edit: yScale and yScaleToggle put the value axis on a log scale, with
// Linear and Log buttons in the header (lib/chart-frame), for values that run
// from tiny to large. Stacked areas add up from zero, so their Log is off.
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
"use client"

import { Fragment } from "react"
import { Area, AreaChart } from "recharts"

import { ChartFrame, endDot } from "@siyahi/ui/lib/chart-frame"
import { QUIET, drawOrder } from "@siyahi/ui/lib/chart-marks"
import type {
  ChartCurve,
  LineMarksProps,
  NumericXProps,
  SeriesChartProps,
  ValueScaleProps,
} from "@siyahi/ui/lib/chart-series"

export interface AreaChartCardProps<T extends object, K extends keyof T>
  extends SeriesChartProps<T, K>,
    NumericXProps,
    ValueScaleProps,
    LineMarksProps<T, K> {
  /** Stack the series into a total instead of overlapping them. */
  stacked?: boolean
  curve?: ChartCurve
}

/**
 * Values over an ordered axis: overlapping series drawn as lines, or stacked into a total as tinted bands. A
 * stack keeps solid edges through a forecast stretch, since a dashed copy of a band would stack twice; the hatched
 * band still marks it.
 */
export function AreaChartCard<T extends object, K extends keyof T>({
  stacked = false,
  curve = "monotone",
  ...props
}: AreaChartCardProps<T, K>) {
  // Past forecastFrom the end is a forecast: its dot is hollow. Only overlapping series also dash, over a card
  // halo, over a hatched band; a stack keeps solid edges and no hatching, since a dashed copy of a band would stack
  // twice and its fills already cover the stretch.
  const forecastEnd = props.forecastFrom !== undefined
  const forecast = !stacked && forecastEnd
  const count = props.data.length
  const series = stacked ? props.series : drawOrder(props.series)
  return (
    <ChartFrame
      chart={AreaChart}
      // A stack's layers add up from zero, which a log axis has no place for.
      logBlocked={stacked ? "Log cannot show stacked areas" : undefined}
      endLabels={!stacked}
      forecastHatch={!stacked}
      curve={curve}
      {...props}
    >
      {/* Every forecast's card-coloured halo first, under every line, so the hatching never runs beside a dashed
          line and no series' halo can erase a neighbour's. */}
      {forecast &&
        series.map(({ key }) => (
          <Area
            key={`halo-${key}`}
            dataKey={key}
            type={curve}
            fill="none"
            stroke="var(--card)"
            strokeWidth={6}
            dot={false}
            activeDot={false}
            tooltipType="none"
            legendType="none"
            className="chart-forecast"
            animationDuration={1300}
          />
        ))}
      {series.map(({ key, color }) => {
        const quiet = color === QUIET
        return (
          <Fragment key={key}>
            <Area
              dataKey={key}
              type={curve}
              fill={stacked ? color : "none"}
              fillOpacity={stacked ? 0.25 : undefined}
              stroke={color}
              strokeWidth={2}
              // With a forecast the end is a forecast: only the dashed copy marks it, hollow.
              dot={quiet || forecast ? false : endDot(color, count, forecastEnd)}
              stackId={stacked ? "stack" : undefined}
              className={forecast ? "chart-actual" : undefined}
              animationDuration={1300}
            />
            {forecast && (
              <Area
                dataKey={key}
                type={curve}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={quiet ? false : endDot(color, count, true)}
                activeDot={false}
                tooltipType="none"
                legendType="none"
                className="chart-forecast"
                animationDuration={1300}
              />
            )}
          </Fragment>
        )
      })}
    </ChartFrame>
  )
}
