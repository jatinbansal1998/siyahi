// Registry: @niko-table/data-table-pagination
// Origin: https://niko-table.com/r/data-table-pagination.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-11-27, sha256 d86feec2277132ce218c2e4609018de326973ef85a3cdda1a2af0fb0671c3ced
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
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
import { useDataTable } from "../core/data-table-context"
import {
  TablePagination,
  type TablePaginationProps,
} from "../filters/table-pagination"

type DataTablePaginationProps<TData extends RowData> = Omit<
  TablePaginationProps<TData>,
  "table" | "isLoading"
> & {
  /**
   * Override the loading state from context
   */
  isLoading?: boolean | undefined
}

export function DataTablePagination<TData extends RowData>({
  isLoading: externalLoading,
  ...props
}: DataTablePaginationProps<TData>) {
  const { table, isLoading: contextLoading } = useDataTable<TData>()

  // Use external loading if provided, otherwise use context loading
  const isLoading = externalLoading ?? contextLoading

  return <TablePagination table={table} isLoading={isLoading} {...props} />
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

DataTablePagination.displayName = "DataTablePagination"
