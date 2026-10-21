// Registry: @dashboardcn/distribution-bar
// Origin: https://dashboardcn.com/r/distribution-bar.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-22, sha256 9028368f1363732cef765dabad2eca3ba98b608f1e237123b09df701c41c8b5a
// Siyahi edit: numbers follow the SiyahiProvider locale instead of
// dashboardcn's en-US lib/format, which is not copied.
// Siyahi edit: min and max fix the scale, for a budget or a capacity the
// segments do not fill: the rest of the track stays empty. A segment below
// zero stacks leftward from zero, so losses and gains can pull against each
// other on one bar. Segments sit at absolute positions instead of in a flex
// row, and a card-coloured edge parts them instead of the row's gap.
// Siyahi edit: markers draw a labelled line across the bar at a value, such
// as a limit; on a fixed scale the legend gives each segment's value, since a
// share of the total says little against a capacity.
// Siyahi edit: without min and max the bar runs from the negative segments'
// total to the positive ones', so a loss is never clipped off the left; a
// marker past either end is dropped, and markers at one value keep their own
// keys. A page's aria-label replaces the generated one on the bar. A label
// at either end aligns to that end, so it does not spill past the bar.
// Siyahi edit: highlighted fades every segment but one, and onHover reports
// the segment under the pointer, so a page can drive a readout from it.
// Segments take a key for when names repeat, and chart tokens as colours.
import * as React from "react"

import { cn } from "@siyahi/ui/lib/utils"
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider"
import type { ChartColor } from "@siyahi/ui/lib/chart-series"
import { pct } from "@siyahi/ui/lib/format"

export interface DistributionSegment {
  name: string
  value: number
  /** Defaults to chart-1 through chart-5 in order; var(--muted) for space that is free. */
  color?: ChartColor | "var(--muted)"
  /** Stable key when names can repeat. */
  key?: string
}

export interface DistributionMarker {
  /** The value the line marks, on the bar's scale. */
  at: number
  label?: string
}

export interface DistributionBarProps extends Omit<React.ComponentProps<"div">, "onMouseLeave"> {
  segments: DistributionSegment[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  /** Show absolute values in the legend in addition to the share. */
  showValues?: boolean
  /** The value the bar's right end stands for. Defaults to the positive segments' total. */
  max?: number
  /**
   * The value the bar's left end stands for. Defaults to the negative segments' total, or 0 when there are none.
   * Above zero, segments (which start at zero) fall off the bar.
   */
  min?: number
  markers?: DistributionMarker[]
  /** The key (or name) of the one segment to keep solid; the rest fade. */
  highlighted?: string | null
  /** Called with the segment under the pointer, and null when it leaves the bar. */
  onHover?: (segment: DistributionSegment | null) => void
}

const defaultColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

function DistributionBar({
  segments,
  valueFormatter,
  showLegend = true,
  showValues = false,
  max,
  min,
  markers = [],
  highlighted = null,
  onHover,
  className,
  "aria-label": ariaLabel,
  ...props
}: DistributionBarProps) {
  const locale = useLocale()
  const format =
    valueFormatter ??
    ((value: number) =>
      new Intl.NumberFormat(locale.numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(value))
  const total = segments.reduce((sum, segment) => sum + Math.abs(segment.value), 0)
  const gains = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0)
  const losses = segments.reduce((sum, segment) => sum + Math.min(segment.value, 0), 0)
  const bottom = min ?? losses
  const top = max ?? gains
  const span = top - bottom || 1
  const position = (value: number) => ((value - bottom) / span) * 100
  // A marker past either end has nowhere on the bar to go, as Recharts drops a reference line outside its domain.
  const shown = markers
    .filter((marker) => marker.at >= bottom && marker.at <= top)
    .map((marker, index) => ({ ...marker, key: `${marker.at}:${marker.label ?? ""}:${index}` }))
  let above = 0
  let below = 0
  const resolved = segments.map((segment, index) => {
    const key = segment.key ?? segment.name
    const size = Math.abs(segment.value)
    // Positive segments stack rightward from zero, negative ones leftward.
    const start = segment.value < 0 ? (below -= size) : (above += size) - size
    return {
      ...segment,
      key,
      color: segment.color ?? defaultColors[index % defaultColors.length],
      share: total > 0 ? size / total : 0,
      left: position(start),
      width: (size / span) * 100,
    }
  })
  const figure = (segment: (typeof resolved)[number]) =>
    max === undefined ? pct(segment.share, locale) : format(segment.value)

  return (
    <div
      data-slot="distribution-bar"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="relative">
        {shown.some((m) => m.label) ? (
          <div className="text-muted-foreground relative h-4 font-mono text-xs">
            {shown.map((marker) =>
              marker.label ? (
                <span
                  key={marker.key}
                  className={cn(
                    "absolute top-0 whitespace-nowrap",
                    // Centred on its line, except at the ends, where it aligns inward.
                    position(marker.at) <= 5
                      ? "translate-x-0"
                      : position(marker.at) >= 95
                        ? "-translate-x-full"
                        : "-translate-x-1/2"
                  )}
                  style={{ left: `${position(marker.at)}%` }}
                >
                  {marker.label}
                </span>
              ) : null
            )}
          </div>
        ) : null}
        <div
          role="img"
          aria-label={
            ariaLabel ??
            resolved
              .map((segment) => `${segment.name} ${figure(segment)}`)
              .join(", ")
          }
          className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full"
          onMouseLeave={onHover ? () => onHover(null) : undefined}
        >
          {resolved.map((segment) =>
            segment.width > 0 ? (
              <div
                key={segment.key}
                data-slot="distribution-segment"
                className="border-card absolute inset-y-0 border-x transition-[width,left,opacity] duration-300"
                style={{
                  left: `${segment.left}%`,
                  width: `${segment.width}%`,
                  backgroundColor: segment.color,
                  opacity: highlighted === null || highlighted === segment.key ? 1 : 0.35,
                }}
                onMouseEnter={onHover ? () => onHover(segment) : undefined}
              />
            ) : null
          )}
        </div>
        {shown.map((marker) => (
          <div
            key={marker.key}
            data-slot="distribution-marker"
            aria-hidden="true"
            className="bg-foreground absolute bottom-0 h-2.5 w-0.5 -translate-x-1/2"
            style={{ left: `${position(marker.at)}%` }}
          />
        ))}
      </div>
      {showLegend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {resolved.map((segment) => (
            <li key={segment.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-muted-foreground">{segment.name}</span>
              <span className="font-medium tabular-nums">
                {figure(segment)}
              </span>
              {showValues && max === undefined ? (
                <span className="text-muted-foreground tabular-nums">
                  ({format(segment.value)})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { DistributionBar }
