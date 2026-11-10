// Registry: @shadcn/chart-line-multiple
// Origin: https://ui.shadcn.com/r/styles/new-york-v4/chart-line-multiple.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-21, sha256 20c708ac3e313e275a84119970b6046142f24c869a9355caec5483aa4feb6ddd
// Siyahi edit: the sample data, config and footer are replaced by props, so a
// page passes rows and series and never puts Recharts parts together itself.
// Siyahi edit: the card, axes, solid grid, tooltip and legend come from
// lib/chart-frame, shared with BarChartCard and AreaChartCard. The axes keep
// Recharts' default ids, which a page can no longer change (dash#88).
// Siyahi edit: xDomain and xTicks make the x axis numeric, so a mark can sit
// between two samples, as the Dell page's events do between 15 s samples.
// Siyahi edit: curve picks the block's monotone or straight segments
// (chart-line-linear), since the Dell page draws measured samples as linear.
// Siyahi edit: each line ends in a dot on its latest point.
// Siyahi edit: yScale and yScaleToggle put the value axis on a log scale, with
// Linear and Log buttons in the header (lib/chart-frame), for values that run
// from tiny to large.
// Siyahi edit: each series is named at its line's end instead of in a legend
// (lib/chart-marks), where the card is wide enough; quiet series (muted) draw
// first, named in muted text; in the legend a grey name raises its line. A forecast stretch (forecastFrom) dashes each line
// after it over a card-coloured halo, with a hollow end dot; today gets a
// rule. Lines draw in over 1.3s.
// Charts ship only in shadcn's new-york-v4 style; nothing here is styled by it.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
"use client"

import { Fragment } from "react"
import { Line, LineChart } from "recharts"

import { ChartFrame, endDot } from "@siyahi/ui/lib/chart-frame"
import { QUIET, drawOrder } from "@siyahi/ui/lib/chart-marks"
import type {
  ChartCurve,
  LineMarksProps,
  NumericXProps,
  SeriesChartProps,
  ValueScaleProps,
} from "@siyahi/ui/lib/chart-series"

export interface LineChartCardProps<T extends object, K extends keyof T>
  extends SeriesChartProps<T, K>,
    NumericXProps,
    ValueScaleProps,
    LineMarksProps<T, K> {
  curve?: ChartCurve | undefined
}

/** Values over an ordered axis as lines: one series, or several to compare, such as sales against a target. */
export function LineChartCard<T extends object, K extends keyof T>({
  curve = "monotone",
  ...props
}: LineChartCardProps<T, K>) {
  const forecast = props.forecastFrom !== undefined
  const count = props.data.length
  const series = drawOrder(props.series)
  return (
    <ChartFrame chart={LineChart} endLabels curve={curve} {...props}>
      {/* Every forecast's card-coloured halo first, under every line, so the hatching never runs beside a dashed
          line and no series' halo can erase a neighbour's. */}
      {forecast &&
        series.map(({ key }) => (
          <Line
            key={`halo-${key}`}
            dataKey={key}
            type={curve}
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
        // A quiet series is background for the named ones: no end dot. With a forecast, the end is a forecast: only
        // the dashed copy marks it, hollow.
        const dot = color === QUIET || forecast ? false : endDot(color, count)
        return (
          <Fragment key={key}>
            <Line
              dataKey={key}
              type={curve}
              stroke={color}
              strokeWidth={2}
              dot={dot}
              className={forecast ? "chart-actual" : undefined}
              animationDuration={1300}
            />
            {forecast && (
              <Line
                dataKey={key}
                type={curve}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={color === QUIET ? false : endDot(color, count, true)}
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
