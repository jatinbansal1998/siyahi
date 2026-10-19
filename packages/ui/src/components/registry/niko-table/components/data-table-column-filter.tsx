// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 3092a6696a3fababb139f885652e2755e965035ec52c733eb9d16ee8c3a3828d
import React from "react"

import { cn } from "@siyahi/ui/lib/utils"

/**
 * Wrapper for groups of column filters.
 */
export function DataTableColumnFilter({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  if (children) {
    return <div className={cn("flex items-center", className)}>{children}</div>
  }
  return null
}

DataTableColumnFilter.displayName = "DataTableColumnFilter"
