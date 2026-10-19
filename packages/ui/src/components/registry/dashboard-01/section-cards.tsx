// Registry: @shadcn/dashboard-01
// Origin: https://ui.shadcn.com/r/styles/base-vega/dashboard-01.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-20, sha256 541786ede835855602687f210c82f0ce13f9c486c3210f749f13671702ecb06c
// Siyahi edit: the four sample cards are replaced by an `items` prop, the
// grid carries its own container so it needs no @container/main ancestor,
// and the page, not the block, owns the side gutter.
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

export function SectionCards({ items }: { items: SectionCard[] }) {
  return (
    <div className="@container/main">
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
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
