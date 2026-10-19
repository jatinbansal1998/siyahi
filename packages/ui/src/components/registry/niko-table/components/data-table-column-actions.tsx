// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 81888992f30c214f182125413618bce5f1e0fa89d2a2dd4eb302029890846325
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
import type { RowData } from "@tanstack/react-table"
import React from "react"

import { TableColumnActions } from "../filters/table-column-actions"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Composable container for column actions.
 *
 * Uses column context to automatically detect active states (pinned, sorted, etc.).
 *
 * @example
 * ```tsx
 * <DataTableColumnActions>
 *   <DataTableColumnSortOptions />
 *   <DataTableColumnPinOptions />
 *   <DataTableColumnHideOptions />
 * </DataTableColumnActions>
 * ```
 */
export function DataTableColumnActions<TData extends RowData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnActions>, "isActive"> & {
    /** Override to manually set active state */
    isActive?: boolean
  },
) {
  const context = useColumnHeaderContext<TData, TValue>(false)

  // Auto-detect active state from column context
  const autoIsActive = context?.column
    ? !!(
        context.column.getIsSorted() ||
        context.column.getIsPinned() ||
        context.column.getIsFiltered()
      )
    : false

  const isActive = props.isActive ?? autoIsActive

  return <TableColumnActions {...props} isActive={isActive} />
}

DataTableColumnActions.displayName = "DataTableColumnActions"
