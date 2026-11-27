// Registry: @niko-table/data-table-pagination
// Origin: https://niko-table.com/r/data-table-pagination.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-11-27, sha256 db0445366a218b6bb5bccd62eeb951faa08fc5fca7b42cb877674a1718cfbfb6
// Siyahi edit: Button and Select come from shadcn core directly; niko's primitives
// files only re-export them, as a seam for a base Siyahi does not use.
// Siyahi edit: the range and counts are written as DESIGN.md writes figures, in the
// locale's grouping with an en dash ("1–10 of 1,240 rows"), and a table's items are rows.
// Siyahi edit: the page-size label and page field take ids from useId, so two paginated
// tables on one page keep their own labels.
// Siyahi edit: a new search or filter goes back to the first page, so the reader does not
// land on a page past the rows that are left. Data updates keep the page, unlike
// TanStack's autoResetPageIndex, so a live table stays where the reader left it.
// Siyahi edit: the bar sits level with the table's edges, with no side padding of its own,
// as DESIGN.md sets every block.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
import React from "react"
import { Button } from "@siyahi/ui/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@siyahi/ui/components/ui/select"
import { Input } from "@siyahi/ui/components/ui/input"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@siyahi/ui/components/ui/skeleton"
import { useFormat } from "@siyahi/ui/lib/format"

import type { DataTableInstance } from "../types"
import type { RowData } from "@tanstack/react-table"
export interface TablePaginationProps<TData extends RowData> {
  table: DataTableInstance<TData>
  pageSizeOptions?: number[] | undefined
  defaultPageSize?: number | undefined
  /**
   * External loading state (e.g., from API)
   */
  isLoading?: boolean | undefined
  /**
   * External fetching state (e.g., from TanStack Query).
   * Disables nav while a request is in flight so users can't advance the
   * cursor before the next page resolves.
   */
  isFetching?: boolean | undefined
  /**
   * Explicitly disable the next page button.
   * Useful when you want to prevent navigation during initial load but allow it during background fetching.
   */
  disableNextPage?: boolean | undefined
  /**
   * Explicitly disable the previous page button.
   * Useful when you want to prevent navigation during initial load but allow it during background fetching.
   */
  disablePreviousPage?: boolean | undefined
  /**
   * Total count of items from server (for server-side pagination).
   * If provided, this will be used instead of table.getFilteredRowModel().rows.length
   */
  totalCount?: number | undefined
  onPageSizeChange?: ((pageSize: number, pageIndex: number) => void) | undefined
  onPageChange?: ((pageIndex: number) => void) | undefined
  onNextPage?: ((pageIndex: number) => void) | undefined
  onPreviousPage?: ((pageIndex: number) => void) | undefined
  /**
   * Callback when pagination initialization is complete
   */
  onPaginationReady?: (() => void) | undefined
}
export function TablePagination<TData extends RowData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = pageSizeOptions[0] ?? 10,
  isLoading,
  isFetching,
  disableNextPage,
  disablePreviousPage,
  totalCount,
  onPageSizeChange,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onPaginationReady,
}: TablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.state.pagination
  const { count } = useFormat()
  const id = React.useId()
  const { columnFilters, globalFilter } = table.state
  const shownFilters = React.useRef([columnFilters, globalFilter])
  React.useEffect(() => {
    const [shownColumns, shownSearch] = shownFilters.current
    if (shownColumns === columnFilters && shownSearch === globalFilter) return
    shownFilters.current = [columnFilters, globalFilter]
    table.setPageIndex(0)
  }, [table, columnFilters, globalFilter])

  // Use totalCount if provided (server-side), otherwise use filtered row model (client-side)
  const totalRows = totalCount ?? table.getFilteredRowModel().rows.length
  const startItem = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalRows)
  const totalPages = table.getPageCount()
  const currentPage = pageIndex + 1

  const [pageInput, setPageInput] = React.useState<string | null>(null)
  const displayValue = pageInput ?? currentPage.toString()

  // Disable nav during any in-flight load (initial OR background fetch) so
  // users can't advance the cursor while the next page is still resolving.
  const canNextPage = table.getCanNextPage()
  const isDisabled = isLoading || isFetching
  const canGoNext = !disableNextPage && !isDisabled && canNextPage
  const canGoPrevious =
    !disablePreviousPage && !isDisabled && table.getCanPreviousPage()

  // Set default page size on initial render
  React.useEffect(() => {
    if (pageSize !== defaultPageSize) {
      table.setPageSize(defaultPageSize)
    }
    onPaginationReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageSizeChange = React.useCallback(
    // Base UI selects pass null on clear; Radix never does
    (value: string | null) => {
      if (!value) return
      const newPageSize = Number(value)
      const newPageIndex = Math.floor((pageIndex * pageSize) / newPageSize)
      table.setPageSize(newPageSize)
      onPageSizeChange?.(newPageSize, newPageIndex)
    },
    [table, pageIndex, pageSize, onPageSizeChange],
  )

  const handlePageInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value)
    },
    [],
  )

  const handlePageInputBlur = React.useCallback(() => {
    const page = parseInt(pageInput ?? "", 10)
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      const newPageIndex = page - 1
      table.setPageIndex(newPageIndex)
      onPageChange?.(newPageIndex)
    }
    setPageInput(null)
  }, [pageInput, totalPages, table, onPageChange])

  const handlePageInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      }
    },
    [],
  )

  const handlePreviousPage = React.useCallback(() => {
    const newPageIndex = pageIndex - 1
    table.previousPage()
    onPreviousPage?.(newPageIndex)
  }, [table, pageIndex, onPreviousPage])

  const handleNextPage = React.useCallback(() => {
    const newPageIndex = pageIndex + 1
    table.nextPage()
    onNextPage?.(newPageIndex)
  }, [table, pageIndex, onNextPage])

  // Show loading skeleton while initializing
  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2"
      aria-label="Table pagination"
    >
      <div className="flex items-center space-x-2">
        <span
          className="text-sm whitespace-nowrap text-muted-foreground"
          id={`${id}-size`}
        >
          Rows per page
        </span>
        <Select
          value={`${Number(pageSize) === 0 ? defaultPageSize : Number(pageSize)}`}
          onValueChange={handlePageSizeChange}
          disabled={isLoading}
        >
          <SelectTrigger
            size="sm"
            className="w-auto min-w-16 focus:ring-0"
            aria-label="Select page size"
            aria-labelledby={`${id}-size`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions?.map(size => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="flex-1 text-right text-sm whitespace-nowrap text-muted-foreground md:text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {totalRows === 0
          ? "0 rows"
          : `${count(startItem)}–${count(endItem)} of ${count(totalRows)} rows`}
      </div>

      <div className="ml-auto flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <label htmlFor={`${id}-page`} className="sr-only">
            Page number
          </label>
          <Input
            id={`${id}-page`}
            type="number"
            min="1"
            max={totalPages}
            value={displayValue}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="h-8 min-w-12 text-center"
            style={{
              width: `${Math.max(String(totalPages).length, 2) + 1}ch`,
            }}
            disabled={totalPages === 0 || isLoading || isFetching}
            aria-label={`Page ${currentPage} of ${totalPages}`}
          />
          <span className="whitespace-nowrap" aria-hidden="true">
            of {count(Math.max(1, totalPages))} pages
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious}
            aria-label={`Go to previous page, page ${pageIndex}`}
            title="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={!canGoNext}
            aria-label={`Go to next page, page ${pageIndex + 2}`}
            title="Go to next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TablePagination.displayName = "TablePagination"
