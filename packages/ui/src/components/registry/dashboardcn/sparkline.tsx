// Registry: @dashboardcn/sparkline
// Origin: https://dashboardcn.com/r/sparkline.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-26, sha256 54b43e63d866bcdf8071744df08e87f29385ba60d480ab9ee8aa1fac3eb33d5c
// Siyahi edit: color takes a chart token, --chart-1 by default, or a meaning
// colour for a trend that is a gain or a loss, instead of any CSS colour.
// Siyahi edit: no dot-grid fill. Its mask paints with a raw #fff, which the
// theme's colour rules reject, and the plain gradient reads the same small.
// Siyahi edit: a hidden value axis fitted to the data. Recharts' default axis
// starts at zero, so a portfolio's run from ₹38L to ₹45L drew as a flat line.
// With the lowest point now on the edge, 2px of room below keeps its stroke whole.
import * as React from "react"
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, YAxis } from "recharts"

import { cn } from "@siyahi/ui/lib/utils"
import type { ChartColor } from "@siyahi/ui/lib/chart-series"

export interface SparklineProps extends React.ComponentProps<"div"> {
  /** Series to plot, oldest first. */
  data: number[]
  variant?: "area" | "line"
  /** A chart slot, or var(--positive) or var(--negative) for a gain or a loss. Defaults to var(--chart-1). */
  color?: ChartColor
  curve?: "monotone" | "linear" | "step"
  strokeWidth?: number
  /** Animate after hydration and when data changes. Respects reduced motion. */
  animate?: boolean
  animationDuration?: number
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}

function getReducedMotionServerSnapshot() {
  return true
}

function Sparkline({
  data,
  variant = "area",
  color = "var(--chart-1)",
  curve = "monotone",
  strokeWidth = 1.5,
  animate = true,
  animationDuration = 500,
  className,
  ...props
}: SparklineProps) {
  const id = React.useId()
  const reducedMotion = React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const animationActive = animate && !reducedMotion
  const points = React.useMemo(() => data.map((y, i) => ({ i, y })), [data])
  const margin = { top: 2, right: 0, bottom: 2, left: 0 }
  const axis = <YAxis hide domain={["dataMin", "dataMax"]} />

  return (
    <div
      data-slot="sparkline"
      aria-hidden="true"
      className={cn("h-10 w-full", className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart data={points} margin={margin}>
            {axis}
            <Line
              type={curve}
              dataKey="y"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={animationActive}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          </LineChart>
        ) : (
          <AreaChart data={points} margin={margin}>
            {axis}
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type={curve}
              dataKey="y"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${id})`}
              dot={false}
              isAnimationActive={animationActive}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export { Sparkline }
