// Registry: @dashboardcn/bar-list
// Origin: https://dashboardcn.com/r/bar-list.json
// Licence: MIT, Copyright (c) 2026 dashboardcn contributors, https://github.com/NoahGdev/dashboardcn/blob/main/LICENSE
// Copied: 2026-10-20, sha256 bc19cf1f5e486fa11273e7d7ed620eb7b82ba360f72e5a15e6bf488f992d16ce
// Siyahi edit: numbers follow the SiyahiProvider locale instead of
// dashboardcn's en-US lib/format, which is not copied.
import * as React from "react"

import { cn } from "@siyahi/ui/lib/utils"
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider"
import { pct } from "@siyahi/ui/lib/format"

export interface BarListItem {
  name: string
  value: number
  /** Renders the label as a link. */
  href?: string
  icon?: React.ReactNode
  /** Stable key when names can repeat. */
  key?: string
}

export interface BarListProps extends React.ComponentProps<"div"> {
  data: BarListItem[]
  valueFormatter?: (value: number) => string
  sortOrder?: "descending" | "ascending" | "none"
  /** Any CSS color. Defaults to chart-1. */
  color?: string
  /** Show each row's share of the total next to its value. */
  showPercentage?: boolean
  onItemClick?: (item: BarListItem) => void
}

function BarList({
  data,
  valueFormatter,
  sortOrder = "descending",
  color = "var(--chart-1)",
  showPercentage = false,
  onItemClick,
  className,
  ...props
}: BarListProps) {
  const locale = useLocale()
  const format =
    valueFormatter ??
    ((value: number) =>
      new Intl.NumberFormat(locale.numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(value))
  const items = React.useMemo(() => {
    if (sortOrder === "none") return data
    const sorted = [...data].sort((a, b) => a.value - b.value)
    return sortOrder === "descending" ? sorted.reverse() : sorted
  }, [data, sortOrder])
  const max = Math.max(...items.map((item) => item.value), 0)
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div
      data-slot="bar-list"
      className={cn("flex flex-col gap-1.5", className)}
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
            className="flex items-center gap-3 text-sm"
          >
            <div className="relative flex h-8 min-w-0 flex-1 items-center">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-300"
                style={{
                  width: `${width}%`,
                  backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)`,
                }}
              />
              <Label
                {...(item.href ? { href: item.href } : {})}
                {...(onItemClick && !item.href
                  ? { type: "button" as const, onClick: () => onItemClick(item) }
                  : {})}
                className={cn(
                  "relative flex min-w-0 items-center gap-2 px-2 text-left",
                  interactive && "hover:underline"
                )}
              >
                {item.icon ? (
                  <span className="text-muted-foreground shrink-0 [&>svg]:size-4">
                    {item.icon}
                  </span>
                ) : null}
                <span className="truncate">{item.name}</span>
              </Label>
            </div>
            <div className="flex shrink-0 items-center gap-2 tabular-nums">
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
