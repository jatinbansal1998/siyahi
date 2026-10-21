import type { RowData } from "@tanstack/react-table";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";
import { useFormat } from "@siyahi/ui/lib/format";

export interface DataTableRowCountProps {
  /** What a row is, plural: "positions" prints "48 positions" while nothing is filtered. */
  unit: string;
  /** Rows before any filter. Defaults to the table's data; pass it when the page narrowed the data before the table. */
  total?: number;
}

/** How many rows the filters leave: "12 of 48", or "48 positions" when they leave all. For a table toolbar, at its end. */
export function DataTableRowCount<TData extends RowData>({ unit, total }: DataTableRowCountProps) {
  const { table } = useDataTable<TData>();
  const { count } = useFormat();
  const all = total ?? table.getCoreRowModel().rows.length;
  const shown = table.getFilteredRowModel().rows.length;
  return (
    <span data-slot="data-table-row-count" className="ml-auto text-sm text-muted-foreground tabular-nums">
      {shown === all ? `${count(all)} ${unit}` : `${count(shown)} of ${count(all)}`}
    </span>
  );
}
