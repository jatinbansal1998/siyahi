// Registry: @niko-table/data-table-column-sort
// Origin: https://niko-table.com/r/data-table-column-sort.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 c55fcdd4f3be1ff7a4ace2830e878b12c79e1374e6db6816ae6fb00e11dba42f
import type { RowData } from "@tanstack/react-table"
import React from "react"

import {
  TableColumnSortOptions,
  TableColumnSortMenu,
} from "../filters/table-column-sort"
import { useDataTable } from "../core/data-table-context"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Sorting options for column header menu using context.
 */
export function DataTableColumnSortOptions<TData extends RowData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortOptions>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortOptions column={column} table={table} {...props} />
}

DataTableColumnSortOptions.displayName = "DataTableColumnSortOptions"

/**
 * Sorting menu for column header using context.
 *
 * Standalone button variant for inline use outside dropdown menus.
 */
export function DataTableColumnSortMenu<TData extends RowData, TValue>(
  props: Omit<
    React.ComponentProps<typeof TableColumnSortMenu>,
    "column" | "table"
  >,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  const { table } = useDataTable<TData>()
  return <TableColumnSortMenu column={column} table={table} {...props} />
}

DataTableColumnSortMenu.displayName = "DataTableColumnSortMenu"
