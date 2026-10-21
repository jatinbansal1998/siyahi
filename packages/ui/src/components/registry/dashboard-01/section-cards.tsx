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
"use client"

import * as React from "react"

import { Badge } from "@siyahi/ui/components/ui/badge"
import {
  Card,
  CardAction,
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
  /** Bold first footer line. */
  headline?: React.ReactNode
  /** Muted second footer line. */
  detail?: React.ReactNode
}

// Tailwind finds classes by scanning source, so each step is written out whole.
const COLUMNS: Record<number, string> = {
  2: "@xl/main:grid-cols-2",
  3: "@3xl/main:grid-cols-3",
  4: "@xl/main:grid-cols-2 @5xl/main:grid-cols-4",
  5: "@3xl/main:grid-cols-3 @7xl/main:grid-cols-5",
  6: "@3xl/main:grid-cols-3",
}

export function SectionCards({ items }: { items: SectionCard[] }) {
  return (
    <div className="@container/main">
      <div className={cn("grid grid-cols-1 gap-4", COLUMNS[items.length] ?? COLUMNS[4])}>
        {items.map((item) => (
          <Card key={item.label} className="@container/card">
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
            {(item.headline || item.detail) && (
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                {item.headline && <div className="line-clamp-1 flex gap-2 font-medium">{item.headline}</div>}
                {item.detail && <div className="text-muted-foreground">{item.detail}</div>}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
