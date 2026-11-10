// Registry: @dashboardcn/bar-list
// Origin: https://dashboardcn.com/r/bar-list.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-20, sha256 bc19cf1f5e486fa11273e7d7ed620eb7b82ba360f72e5a15e6bf488f992d16ce
// Siyahi edit: numbers follow the SiyahiProvider locale instead of
// dashboardcn's en-US lib/format, which is not copied.
// Siyahi edit: the bar fill is 32% of its colour, not 20%, so it reads against a white card.
// Siyahi edit: the label sits on a full-width muted track with the translucent
// bar behind it, in full-contrast text, so a short bar ending mid-label does
// not cut the name in two ("WIPR|O").
// Siyahi edit: a row with a detail (a Delta) draws a neutral bar, so the
// detail's red or green is the row's only colour.
// Siyahi edit: rows share one figure column, so every track ends at the same x
// and the figures right-align to the list's own edge.
// Siyahi edit: max sets the value a full-width bar stands for, so two lists
// (the biggest gains beside the biggest losses) can share one scale.
// Siyahi edit: an item's optional detail (a secondary figure such as a Delta)
// renders after its label, outside the link, and does not shrink, so a long
// label truncates before the figure does.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
import * as React from "react"

import { cn } from "@siyahi/ui/lib/utils"
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider"
// Siyahi edit: reuse the locale's compact formatter across rows and renders.
// Siyahi edit: narrow lists wrap full labels above their bars, preserving
// readable names and exact figures rather than clipping them inside a fill.
import { pct } from "@siyahi/ui/lib/format"

export interface BarListItem {
  name: string
  value: number
  /** Renders the label as a link. */
  href?: string | undefined
  icon?: React.ReactNode
  /** Secondary figure after the label, such as a `Delta`. */
  detail?: React.ReactNode
  /** Stable key when names can repeat. */
  key?: string | undefined
}

export interface BarListProps extends React.ComponentProps<"div"> {
  data: BarListItem[]
  valueFormatter?: ((value: number) => string) | undefined
  sortOrder?: "descending" | "ascending" | "none" | undefined
  /** Any CSS color. Defaults to chart-1. */
  color?: string | undefined
  /** Show each row's share of the total next to its value. */
  showPercentage?: boolean | undefined
  /** The value a full-width bar stands for. Give two lists the same max to draw them on one scale. Defaults to the largest value. */
  max?: number | undefined
  onItemClick?: ((item: BarListItem) => void) | undefined
}

function BarList({
  data,
  valueFormatter,
  sortOrder = "descending",
  color = "var(--chart-1)",
  showPercentage = false,
  max: scale,
  onItemClick,
  className,
  ...props
}: BarListProps) {
  const locale = useLocale()
  const defaultFormat = React.useMemo(
    () => new Intl.NumberFormat(locale.numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format,
    [locale.numberLocale],
  )
  const format = valueFormatter ?? defaultFormat
  const items = React.useMemo(() => {
    if (sortOrder === "none") return data
    const sorted = [...data].sort((a, b) => a.value - b.value)
    return sortOrder === "descending" ? sorted.reverse() : sorted
  }, [data, sortOrder])
  const max = scale ?? Math.max(...items.map((item) => item.value), 0)
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div
      data-slot="bar-list"
      className={cn("@container/bar-list grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5", className)}
      {...props}
    >
      {items.map((item) => {
        const width = max > 0 ? (item.value / max) * 100 : 0
        const share = total > 0 ? item.value / total : 0
        const interactive = Boolean(item.href || onItemClick)
        const Label = item.href ? "a" : onItemClick ? "button" : "div"

        return (
          <div
            key={item.key ?? item.name}
            data-slot="bar-list-row"
            className="col-span-2 grid grid-cols-subgrid items-center text-sm @max-sm/bar-list:items-start"
          >
            <div className="relative flex h-8 min-w-0 flex-1 items-center @max-sm/bar-list:h-auto @max-sm/bar-list:min-h-8 @max-sm/bar-list:items-start @max-sm/bar-list:pb-3">
              <div
                data-slot="bar-list-track"
                aria-hidden="true"
                className="bg-muted/60 absolute inset-0 rounded-md @max-sm/bar-list:inset-y-auto @max-sm/bar-list:bottom-0 @max-sm/bar-list:h-1.5"
              />
              <div
                data-slot="bar-list-bar"
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-300 @max-sm/bar-list:inset-y-auto @max-sm/bar-list:bottom-0 @max-sm/bar-list:h-1.5"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.detail
                    ? "color-mix(in oklab, var(--muted-foreground) 20%, transparent)"
                    : `color-mix(in oklab, ${color} 32%, transparent)`,
                }}
              />
              <Label
                {...(item.href ? { href: item.href } : {})}
                {...(onItemClick && !item.href
                  ? { type: "button" as const, onClick: () => onItemClick(item) }
                  : {})}
                className={cn(
                  "text-foreground relative flex min-w-0 items-center gap-2 px-2 text-left",
                  interactive && "hover:underline"
                )}
              >
                {item.icon ? (
                  <span className="text-muted-foreground shrink-0 [&>svg]:size-4">
                    {item.icon}
                  </span>
                ) : null}
                <span className="truncate @max-sm/bar-list:whitespace-normal">{item.name}</span>
              </Label>
              {item.detail ? (
                <span
                  data-slot="bar-list-detail"
                  className="text-muted-foreground relative shrink-0 pr-2 text-xs tabular-nums"
                >
                  {item.detail}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 tabular-nums">
              <span className="font-medium">{format(item.value)}</span>
              {showPercentage ? (
                <span className="text-muted-foreground w-12 text-right text-xs">
                  {pct(share, locale, 0)}
                </span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { BarList }
