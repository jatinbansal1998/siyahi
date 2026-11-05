// A table whose columns do not fit its width hides its other columns, rightmost first, until they do; the reader
// brings them back with DataTableCompactColumnsToggle. Columns that must stay opt in with `meta.compact`.
import type { ColumnVisibilityState, RowData } from "@tanstack/react-table";
import React from "react";
import type { DataTableColumnDef } from "@siyahi/ui/components/registry/niko-table/types";

// TanStack's size for a column that names none.
const DEFAULT_SIZE = 150;

/** Reports the element's inner width whenever it changes. */
export function useTableWidth(element: HTMLElement | null, onChange: (width: number) => void): void {
  React.useLayoutEffect(() => {
    if (!element) return;
    const measure = () => {
      if (element.clientWidth > 0) onChange(element.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, onChange]);
}

/** Narrower than 40rem, the width a phone gives a table: freezing is suspended and toolbars fold. */
export function isCompactWidth(width: number): boolean {
  if (width <= 0) return false;
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return width < 40 * rem;
}

// TanStack derives an accessor column's id from its key, with dots made underscores.
function columnId<TData extends RowData>(column: DataTableColumnDef<TData>): string | undefined {
  if (column.id) return column.id;
  const key = (column as { accessorKey?: unknown }).accessorKey;
  return typeof key === "string" ? key.replaceAll(".", "_") : undefined;
}

export interface FittedColumns {
  /** The caller's visibility with the columns that do not fit turned off. */
  visibility: ColumnVisibilityState;
  /** The columns turned off to fit; empty when everything fits. */
  hidden: ReadonlySet<string>;
}

/**
 * Which columns to hide so the table fits `width`: the rightmost columns without `meta.compact` go first. Null
 * when no column sets `meta.compact`, so a table that never opted in keeps every column and scrolls.
 */
export function fitColumns<TData extends RowData>(
  columns: DataTableColumnDef<TData>[],
  order: string[],
  visibility: ColumnVisibilityState,
  width: number,
): FittedColumns | null {
  if (width <= 0 || !columns.some((column) => column.meta?.compact)) return null;
  const byId = new Map(
    columns.flatMap((column) => {
      const id = columnId(column);
      return id ? [[id, column] as const] : [];
    }),
  );
  const ordered = [...order.filter((id) => byId.has(id)), ...[...byId.keys()].filter((id) => !order.includes(id))];
  const shown = ordered.filter((id) => visibility[id] !== false);
  let total = shown.reduce((sum, id) => sum + (byId.get(id)?.size ?? DEFAULT_SIZE), 0);
  const hidden = new Set<string>();
  for (const id of shown.toReversed()) {
    if (total <= width) break;
    const column = byId.get(id);
    if (column?.meta?.compact) continue;
    hidden.add(id);
    total -= column?.size ?? DEFAULT_SIZE;
  }
  const fitted: ColumnVisibilityState = { ...visibility };
  for (const id of hidden) fitted[id] = false;
  return { visibility: fitted, hidden };
}
