// Registry: @niko-table/data-table-core
// Origin: https://niko-table.com/r/data-table-core.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 7521bf6208309340d846b99c4e571e2cbf416ab0dbdd72f62f72971a8d332d84
// Siyahi edit: pinned cells paint var(--table-fill), not var(--background):
// the theme sets it to the card a table sits in, or the page on an open
// surface, so no lighter or darker stripe runs down the pinned column. This
// inline colour outranks the cells' bg-* classes.
// Siyahi edit: narrow containers suspend sticky styling without changing the
// caller's pinning preference, including externally managed table instances.
// Siyahi edit: the pinned edge is a 1px --border hairline, the weight of the
// row lines, not a 2px foreground rule with a shadow.
import { type Column, type RowData } from "@tanstack/react-table"
import type { DataTableFeatures } from "./data-table-features"
import type React from "react"

export const getCommonPinningStyles = <TData extends RowData>(
  column: Column<DataTableFeatures, TData>,
  isHeader: boolean = false,
  pinningEnabled: boolean = true,
): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  if (!isPinned || !pinningEnabled) return {}

  const isLeft = isPinned === "start"
  const columnSize = column.getSize()

  return {
    position: "sticky",
    top: isHeader ? 0 : undefined,
    left: isLeft ? `${column.getStart("start")}px` : undefined,
    right: !isLeft ? `${column.getAfter("end")}px` : undefined,
    opacity: 1,
    width: columnSize,
    minWidth: columnSize, // Prevent column from shrinking
    maxWidth: columnSize, // Prevent column from growing
    flexShrink: 0, // Prevent flex shrinking
    // Headers: z-20 to stay above other headers and body.
    // Body: z-10 to stay above other body cells.
    zIndex: isHeader ? 20 : 10,
    backgroundColor: "var(--table-fill)", // Ensure opaque background
    // Pinned-column separator. Drawn as an INSET box-shadow (part of the sticky
    // cell's own paint) rather than a plain border: a border on a sticky cell
    // gets covered by scrolled-under content in some browsers, so it vanishes
    // once you scroll horizontally. An inset shadow stays put.
    boxShadow: isLeft ? "inset -1px 0 0 0 var(--border)" : "inset 1px 0 0 0 var(--border)",
  }
}
