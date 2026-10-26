// Registry: @shadcn/dashboard-01
// Origin: https://ui.shadcn.com/r/styles/base-vega/dashboard-01.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-20, sha256 541786ede835855602687f210c82f0ce13f9c486c3210f749f13671702ecb06c
// Siyahi edit: the four sample cards are replaced by an `items` prop, the
// grid carries its own container so it needs no @container/main ancestor,
// and the page, not the block, owns the side gutter.
// Siyahi edit: no light-mode gradient (from-primary/5 to the card) and no
// shadow override, so a stat tile is the stock Card in both schemes, like
// every other card on the page. Under luma the stock Card carries shadow-md,
// and tiles keep it (flat cards were tried in 0.1.6; the default stayed).
// Siyahi edit: the column steps follow the tile count, so no row holds one
// tile under fuller rows (five on the stock 1-2-4 grid showed 4 + 1, siyahi#16).
// Three, five and six skip the two-column step and run three across; five goes
// to one row of five on a container 80rem wide. Steps stay where a tile is at
// least about 240px, as on the stock grid, and a phone keeps one tile per row.
// Siyahi edit: `selected` and `onSelect` make the tiles a picker, such as one
// tile per asset class that scopes the page: a button laid over each tile
// carries aria-pressed, and the picked tile takes a primary ring. The ring is
// important (`!`): the stock Card sets `dark:ring-foreground/10`, which would
// otherwise win in dark mode.
// Siyahi edit: a tile marked disabled cannot be picked: its button is
// disabled and the tile fades, as The Book's attention cards do for a flag
// with no positions.
// Siyahi edit: `trend` puts a chart, usually a Sparkline, between the
// figure and the footer lines, so a tile shows the run behind its value.
// Siyahi edit: the headline wraps instead of being clamped to one line, so a
// long figure line is not cut off on a phone.
"use client"

import * as React from "react"

import { Badge } from "@siyahi/ui/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siyahi/ui/components/ui/card"
import { cn } from "@siyahi/ui/lib/utils"

export interface SectionCard {
  /** Muted label above the value. */
  label: string
  value: React.ReactNode
  /** Outline badge, top right; usually a <Delta />. */
  badge?: React.ReactNode
  /** A small chart under the value, usually a <Sparkline /> of the recent run. */
  trend?: React.ReactNode
  /** Bold first footer line. */
  headline?: React.ReactNode
  /** Muted second footer line. */
  detail?: React.ReactNode
  /** In a picker, a tile that cannot be picked, such as one with nothing in it: faded, and its button disabled. */
  disabled?: boolean
}

// Tailwind finds classes by scanning source, so each step is written out whole.
const COLUMNS: Record<number, string> = {
  2: "@xl/main:grid-cols-2",
  3: "@3xl/main:grid-cols-3",
  4: "@xl/main:grid-cols-2 @5xl/main:grid-cols-4",
  5: "@3xl/main:grid-cols-3 @7xl/main:grid-cols-5",
  6: "@3xl/main:grid-cols-3",
}

export interface SectionCardsProps {
  items: SectionCard[]
  /** The label of the picked tile. */
  selected?: string
  /** Makes each tile one button, so keep tile content non-interactive; gets the label of the tile picked. */
  onSelect?: (label: string) => void
}

export function SectionCards({ items, selected, onSelect }: SectionCardsProps) {
  return (
    <div className="@container/main">
      <div className={cn("grid grid-cols-1 gap-4", COLUMNS[items.length] ?? COLUMNS[4])}>
        {items.map((item) => (
          <Card
            key={item.label}
            className={cn(
              "@container/card",
              onSelect && "relative",
              item.label === selected && "ring-2 ring-primary!",
              onSelect && item.disabled && "opacity-60",
            )}
          >
            {/* A Card is a div, which a button cannot hold, so the button lies over the tile with its radius, for the focus ring to follow the corner. */}
            {onSelect && (
              <button
                type="button"
                aria-label={item.label}
                aria-pressed={item.label === selected}
                disabled={item.disabled}
                onClick={() => onSelect(item.label)}
                className="absolute inset-0 z-10 rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              />
            )}
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.value}
              </CardTitle>
              {item.badge && (
                <CardAction>
                  <Badge variant="outline">{item.badge}</Badge>
                </CardAction>
              )}
            </CardHeader>
            {item.trend && <CardContent>{item.trend}</CardContent>}
            {(item.headline || item.detail) && (
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                {item.headline && <div className="flex flex-wrap gap-2 font-medium">{item.headline}</div>}
                {item.detail && <div className="text-muted-foreground">{item.detail}</div>}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
