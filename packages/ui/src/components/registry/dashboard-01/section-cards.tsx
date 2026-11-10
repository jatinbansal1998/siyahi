// Registry: @shadcn/dashboard-01
// Origin: https://ui.shadcn.com/r/styles/base-vega/dashboard-01.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-20, sha256 541786ede835855602687f210c82f0ce13f9c486c3210f749f13671702ecb06c
// Siyahi edit: the four sample cards are replaced by an `items` prop, the
// grid carries its own container so it needs no @container/main ancestor,
// and the page, not the block, owns the side gutter.
// Siyahi edit: no light-mode gradient (from-primary/5 to the card) and no
// shadow override, so a stat tile is the stock Card in both schemes, like
// every other card on the page.
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
// Siyahi edit: on a ruled page a hairline parts the tiles across and down,
// with a rule above and below the row, as PanelGrid parts blocks; without
// it the boxless tiles floated as loose figures. As in PanelGrid the rules
// sit on a div around each tile, not on the Card: a Card shifted 1px to
// hide its outer rule started 1px into the page gutter (siyahi#34). The
// picked tile's ring is drawn inside the tile there, so the row's edge does
// not clip it.
// Siyahi edit: `trend` puts a chart, usually a Sparkline, between the
// figure and the footer lines, so a tile shows the run behind its value.
// Siyahi edit: the headline wraps instead of being clamped to one line, so a
// long figure line is not cut off on a phone.
// Siyahi edit: tiles sit 12px in from each edge, the small Card's spacing,
// with a 24px figure at every width and 4px between footer lines, so a row of
// figures stays dense; the stock 16px padding and 30px figure ran a six-tile
// block taller than the reading it summed up. The spacing is set, not
// size="sm", which would also shrink the figure to 14px.
// Siyahi edit: a selectable tile focuses with an opaque ring, its only focus
// sign; the half-strength ring was under 2:1 against the card.
// Siyahi edit: square tiles 8px apart on the card surface (16px on an open
// one, whose tiles have no box to part them). On a ruled one, the default,
// the grid is filled with the card colour, so the row stands off the page,
// each tile's rules sit on its bottom and end edges, and the footer keeps its
// rule and band: the empty cell at the end of a 3 + 2 row is a blank stretch
// of the sheet, ruled off like the rest. The row carries data-surface, so the
// theme draws the surface the row laid itself out for even inside a portal.
// Siyahi edit: the label and the footer lines are small monospaced capitals
// (`font-mono text-2xs tracking-wider uppercase`), set apart from the figure.
// Siyahi edit: `tone` marks a tile as an exception (a loss, a figure behind
// plan): the theme washes it in the tone and outlines it. The page sets it;
// a negative change alone is not an exception (a falling cost is good news).
// Siyahi edit: `stale` marks a tile's data as old, with since when: the theme
// greys the tile and a small "Stale · 3 Nov" note sits under its label. The
// page sets it, as it sets a tone.
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
import { useSurface } from "@siyahi/ui/components/siyahi/siyahi-provider"
import { StaleNote } from "@siyahi/ui/components/siyahi/stale-note"

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
  /** Marks the tile as the exception on the page: a faint wash of the colour and an outline of it. */
  tone?: "negative" | "warning"
  /** Marks the tile's data as old, with since when, such as "3 Nov": the tile greys out and says so. */
  stale?: React.ReactNode
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
  const surface = useSurface()
  const ruled = surface === "ruled"
  return (
    <div data-surface={surface} className={cn("@container/main", ruled && "overflow-hidden border-y")}>
      <div className={cn("grid grid-cols-1", ruled ? "-me-px -mb-px bg-card" : surface === "open" ? "gap-4" : "gap-2", COLUMNS[items.length] ?? COLUMNS[4])}>
        {items.map((item) => (
          <div key={item.label} data-slot="section-card" className={cn("min-w-0", ruled && "border-e border-b")}>
            <Card
              data-tone={item.tone}
              data-stale={item.stale ? "" : undefined}
              className={cn(
                "@container/card h-full [--card-spacing:--spacing(3)]",
                onSelect && "relative",
                item.label === selected && "ring-2 ring-primary!",
                item.label === selected && ruled && "ring-inset",
                onSelect && item.disabled && "opacity-60",
              )}
            >
              {/* A Card is a div, which a button cannot hold, so the button lies over the tile and takes its radius, for the focus ring to follow the corner. */}
              {onSelect && (
                <button
                  type="button"
                  aria-label={item.label}
                  aria-pressed={item.label === selected}
                  disabled={item.disabled}
                  onClick={() => onSelect(item.label)}
                  className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                />
              )}
              <CardHeader>
                <CardDescription className="font-mono text-2xs tracking-wider uppercase">{item.label}</CardDescription>
                {item.stale && <StaleNote since={item.stale} />}
                <CardTitle className="text-2xl font-semibold tabular-nums">
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
                <CardFooter className="flex-col items-start gap-1 font-mono text-2xs tracking-wider uppercase">
                  {item.headline && <div className="flex flex-wrap gap-2 font-medium">{item.headline}</div>}
                  {item.detail && <div className="text-muted-foreground">{item.detail}</div>}
                </CardFooter>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
