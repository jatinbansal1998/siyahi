// Registry: @niko-table/data-table-core
// Origin: https://niko-table.com/r/data-table-core.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 6f9df580af7c80c36bb8f87fa8e423058d09bede17efe247cb84a5f1acc90191
import type { RowData } from "@tanstack/react-table"
import type { DataTableInstance } from "../types"

/**
 * Returns `true` when the click landed on (or inside) an interactive
 * element that should suppress `onRowClick`.
 *
 * Also suppresses when the user has an active text selection — accidental
 * row clicks while drag-selecting cell text are a common annoyance,
 * especially on rows that navigate to a detail view on click.
 */
export function isInteractiveClickTarget(target: HTMLElement): boolean {
  // Drag-selected text: a click that ends a selection should not navigate.
  // `window.getSelection` may be undefined in some environments (jsdom
  // edge cases / non-browser SSR), so guard both shapes.
  const selection =
    typeof window !== "undefined" ? window.getSelection?.() : null
  if (selection && !selection.isCollapsed && selection.toString().length > 0) {
    return true
  }

  return Boolean(
    target.closest("button") ||
    target.closest("input") ||
    target.closest("textarea") ||
    target.closest("select") ||
    target.closest("a") ||
    target.closest("label") ||
    target.closest("[contenteditable]") ||
    target.closest('[role="button"]') ||
    target.closest('[role="checkbox"]') ||
    target.closest('[role="combobox"]') ||
    target.closest('[role="menuitem"]') ||
    target.closest('[role="textbox"]') ||
    target.closest("[data-radix-collection-item]") ||
    target.closest('[data-slot="checkbox"]') ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.tagName === "BUTTON" ||
    target.tagName === "A",
  )
}

/**
 * For delegated `<tbody>` handlers. Returns the matched row, or `null`
 * if the click should be ignored (interactive target or no row found).
 */
export function resolveRowFromClick<TData extends RowData>(
  target: HTMLElement,
  table: DataTableInstance<TData>,
) {
  if (isInteractiveClickTarget(target)) return null
  const rowEl = target.closest("tr[data-row-id]")
  if (!rowEl) return null
  const rowId = rowEl.getAttribute("data-row-id")
  if (rowId === null) return null
  return table.getRow(rowId) ?? null
}
