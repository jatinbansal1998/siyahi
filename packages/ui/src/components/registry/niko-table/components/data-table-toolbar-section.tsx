// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 627131c7f07278a5d30cfb104c35b36f7c803fba53a011c489a995aefaeb8d2a
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

export interface DataTableToolbarSectionProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode
}

/**
 * A simple, flexible toolbar container for composing table controls.
 * Use this as a layout container and add your own search, filters, sorting, etc.
 *
 * @example - Basic toolbar with search and filters
 * <DataTableToolbarSection>
 *   <DataTableSearchInput placeholder="Search..." />
 *   <DataTableFilterButton column="status" title="Status" />
 *   <DataTableSortMenu />
 * </DataTableToolbarSection>
 *
 * @example - Custom layout with left and right sections
 * <DataTableToolbarSection className="justify-between">
 *   <div className="flex gap-2">
 *     <DataTableSearchInput />
 *     <DataTableFilterButton column="status" />
 *   </div>
 *   <div className="flex gap-2">
 *     <DataTableSortMenu />
 *     <DataTableViewMenu />
 *   </div>
 * </DataTableToolbarSection>
 *
 * @example - With custom elements
 * <DataTableToolbarSection>
 *   <DataTableSearchInput />
 *   <span className="text-sm text-muted-foreground">
 *     {table.getFilteredRowModel().rows.length} results
 *   </span>
 *   <Button variant="outline">Export</Button>
 * </DataTableToolbarSection>
 */

const DataTableToolbarSectionInternal = React.forwardRef<
  HTMLDivElement,
  DataTableToolbarSectionProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full flex-wrap items-center gap-2 p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
})

DataTableToolbarSectionInternal.displayName = "DataTableToolbarSectionInternal"

// Memoized so table-state changes don't re-render unchanged toolbars.
export const DataTableToolbarSection = React.memo(
  DataTableToolbarSectionInternal,
)

DataTableToolbarSection.displayName = "DataTableToolbarSection"
