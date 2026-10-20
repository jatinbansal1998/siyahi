// Registry: @niko-table/data-table-core
// Origin: https://niko-table.com/r/data-table-core.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 7521bf6208309340d846b99c4e571e2cbf416ab0dbdd72f62f72971a8d332d84
// Siyahi edit: pinned cells paint var(--card), not var(--background). A
// Siyahi table sits in a card, and in dark mode the page background drew a
// darker stripe down the pinned column. This inline colour outranks the
// cells' bg-* classes.
import { type Column, type RowData } from "@tanstack/react-table"
import type { DataTableFeatures } from "./data-table-features"
import type React from "react"

export const getCommonPinningStyles = <TData extends RowData>(
  column: Column<DataTableFeatures, TData>,
  isHeader: boolean = false,
): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}

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
    backgroundColor: "var(--card)", // Ensure opaque background
    // Directional separator on the pinned side — a real inner border (right for
    // left-pinned, left for right-pinned) plus a soft shadow so the frozen
    // column reads as distinct from scrolling content, even in a grid where
    // every cell already has borders. `border-box` keeps it from shifting width.
    // Pinned-column separator. Drawn as an INSET box-shadow (part of the sticky
    // cell's own paint) rather than a plain border: a border on a sticky cell
    // gets covered by scrolled-under content in some browsers, so it vanishes
    // once you scroll horizontally. An inset shadow stays put. A soft OUTER
    // shadow adds depth. `--border` alone is intentionally very faint (10% white
    // in dark mode), so the line is a stronger foreground mix to read clearly.
    ...(isLeft
      ? {
          boxShadow:
            "inset -2px 0 0 0 color-mix(in oklab, var(--foreground) 40%, transparent), 4px 0 8px -2px color-mix(in oklab, var(--foreground) 14%, transparent)",
        }
      : {
          boxShadow:
            "inset 2px 0 0 0 color-mix(in oklab, var(--foreground) 40%, transparent), -4px 0 8px -2px color-mix(in oklab, var(--foreground) 14%, transparent)",
        }),
  }
}
