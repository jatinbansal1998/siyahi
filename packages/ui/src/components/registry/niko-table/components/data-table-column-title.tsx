// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 04344fb4b69717c82a463a04299392ea0c9044034e0782e90ac7135daa1c8dd8
import type { RowData } from "@tanstack/react-table"
import React from "react"

import { TableColumnTitle } from "../filters/table-column-title"
import { useColumnHeaderContext } from "./data-table-column-header"

/**
 * Renders the column title using context.
 */
export function DataTableColumnTitle<TData extends RowData, TValue>(
  props: Omit<React.ComponentProps<typeof TableColumnTitle>, "column">,
) {
  const { column } = useColumnHeaderContext<TData, TValue>(true)
  return <TableColumnTitle column={column} {...props} />
}

DataTableColumnTitle.displayName = "DataTableColumnTitle"
