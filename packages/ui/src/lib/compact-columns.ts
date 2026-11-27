// A table whose columns do not fit its width hides its other columns, rightmost first, until they do; the reader
// brings them back with DataTableCompactColumnsToggle. Columns that must stay opt in with `meta.compact`. A details
// column (dataTableDetailsColumn) shows only while columns are hidden, and opens a row on the ones it lost.
import type { ColumnVisibilityState, RowData } from "@tanstack/react-table";
import React from "react";
import type { DataTableColumnDef } from "@siyahi/ui/components/registry/niko-table/types";

// TanStack's size for a column that names none.
const DEFAULT_SIZE = 150;

/** The id of the column that opens a row on the fields hidden to fit. */
export const DETAILS_COLUMN_ID = "details";

/**
 * Reports the room a table has whenever it changes: the inner width of its scroll box's parent. The box itself is
 * only as wide as the table (siyahi.css), so a short table measured there would read as a phone's.
 */
export function useTableWidth(scrollBox: HTMLElement | null, onChange: (width: number) => void): void {
  React.useLayoutEffect(() => {
    const room = scrollBox?.parentElement;
    if (!room) return;
    const measure = () => {
      if (room.clientWidth > 0) onChange(room.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    return () => observer.disconnect();
  }, [scrollBox, onChange]);
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
 * Which columns to hide so the table fits `width`: the rightmost columns without `meta.compact` go first, and the
 * details column takes its room only once one has gone. With `collapsed` off, the reader asked for every column:
 * the caller's visibility comes back, without the details column, and `hidden` still says what would go. Null
 * when no column sets `meta.compact`, so a table that never opted in keeps every column and scrolls.
 */
export function fitColumns<TData extends RowData>(
  columns: DataTableColumnDef<TData>[],
  order: string[],
  visibility: ColumnVisibilityState,
  width: number,
  collapsed = true,
): FittedColumns | null {
  if (width <= 0 || !columns.some((column) => column.meta?.compact)) return null;
  const byId = new Map(
    columns.flatMap((column) => {
      const id = columnId(column);
      return id ? [[id, column] as const] : [];
    }),
  );
  const ordered = [...order.filter((id) => byId.has(id)), ...[...byId.keys()].filter((id) => !order.includes(id))];
  const shown = ordered.filter((id) => visibility[id] !== false && id !== DETAILS_COLUMN_ID);
  const details = byId.has(DETAILS_COLUMN_ID) && visibility[DETAILS_COLUMN_ID] !== false;
  const detailsSize = details ? (byId.get(DETAILS_COLUMN_ID)?.size ?? DEFAULT_SIZE) : 0;
  let total = shown.reduce((sum, id) => sum + (byId.get(id)?.size ?? DEFAULT_SIZE), 0);
  const hidden = new Set<string>();
  for (const id of shown.toReversed()) {
    if (total + (hidden.size ? detailsSize : 0) <= width) break;
    const column = byId.get(id);
    if (column?.meta?.compact) continue;
    hidden.add(id);
    total -= column?.size ?? DEFAULT_SIZE;
  }
  const fitted: ColumnVisibilityState = { ...visibility };
  if (collapsed) for (const id of hidden) fitted[id] = false;
  if (details && (!collapsed || !hidden.size)) fitted[DETAILS_COLUMN_ID] = false;
  return { visibility: fitted, hidden };
}
