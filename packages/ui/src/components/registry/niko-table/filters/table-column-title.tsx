// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 754af96d81030c85887fd4e866060197cf80c0af4dc4204d7bde69b4b49d8f2a
"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
import React from "react"
import { cn } from "@siyahi/ui/lib/utils"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"

import type { DataTableColumn } from "../types"
import type { RowData } from "@tanstack/react-table"
/**
 * Renders the column title.
 */
export function TableColumnTitle<TData extends RowData, TValue>({
  column,
  title,
  className,
  children,
}: {
  column: DataTableColumn<TData, TValue>
  title?: string
  className?: string
  children?: React.ReactNode
}) {
  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  return (
    <div
      data-slot="column-title"
      className={cn(
        // `min-w-0` so `truncate` can shrink this flex item below its text
        // width (a nowrap flex child otherwise keeps full content width and
        // spills into the neighbouring header cell on narrow columns).
        "min-w-0 truncate py-0.5 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {children ?? derivedTitle}
    </div>
  )
}

TableColumnTitle.displayName = "TableColumnTitle"
