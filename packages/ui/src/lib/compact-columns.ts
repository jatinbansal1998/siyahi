// A table narrower than 40rem is compact; when columns opt in with
// `meta.compact`, it shows only those until the reader asks for every column.
import type { ColumnVisibilityState, RowData } from "@tanstack/react-table";
import React from "react";
import type { DataTableColumnDef } from "@siyahi/ui/components/registry/niko-table/types";

/** Reports whether the element is narrower than 40rem, the width a phone gives a table. */
export function useCompactWidth(element: HTMLElement | null, onChange: (isCompact: boolean) => void): void {
  React.useLayoutEffect(() => {
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      if (width > 0) {
        const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        onChange(width < 40 * rem);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // A changed root font size moves the threshold without resizing the element.
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [element, onChange]);
}

// TanStack derives an accessor column's id from its key, with dots made underscores.
function columnId<TData extends RowData>(column: DataTableColumnDef<TData>): string | undefined {
  if (column.id) return column.id;
  const key = (column as { accessorKey?: unknown }).accessorKey;
  return typeof key === "string" ? key.replaceAll(".", "_") : undefined;
}

/**
 * The visibility a collapsed compact table renders: every column without
 * `meta.compact` hidden, the caller's own choices kept for the rest. Null when
 * no column opts in, so the table shows its columns as asked.
 */
export function collapsedVisibility<TData extends RowData>(
  columns: DataTableColumnDef<TData>[],
  visibility: ColumnVisibilityState,
): ColumnVisibilityState | null {
  if (!columns.some((column) => column.meta?.compact)) return null;
  const collapsed: ColumnVisibilityState = { ...visibility };
  for (const column of columns) {
    const id = columnId(column);
    if (id && !column.meta?.compact) collapsed[id] = false;
  }
  return collapsed;
}
