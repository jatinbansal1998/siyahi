// A phone row keeps the table's key columns; this column opens it on the ones hidden to fit.

import { flexRender, type RowData } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@siyahi/ui/components/ui/button";
import { DataList, DataListItem } from "@siyahi/ui/components/siyahi/data-list";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";
import type { DataTableColumnDef, DataTableRow } from "@siyahi/ui/components/registry/niko-table/types";
import { DETAILS_COLUMN_ID } from "@siyahi/ui/lib/compact-columns";

function DetailsToggle<TData extends RowData>({ row }: { row: DataTableRow<TData> }) {
  const open = row.getIsExpanded();
  const Icon = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-expanded={open}
      aria-label={open ? "Hide details" : "Show details"}
      onClick={() => row.toggleExpanded()}
    >
      <Icon />
    </Button>
  );
}

function RowDetails<TData extends RowData>({ original }: { original: TData }) {
  const { table, compactColumns } = useDataTable<TData>();
  const row = table.getRowModel().rows.find((candidate) => candidate.original === original);
  const cells = row?.getAllCells().filter((cell) => compactColumns?.hidden.has(cell.column.id)) ?? [];
  // A row opened on a phone closes once the table is wide enough to show every column on it.
  useEffect(() => {
    if (row && !cells.length) row.toggleExpanded(false);
  }, [row, cells.length]);
  if (!cells.length) return null;
  return (
    <DataList className="grid grid-cols-2 gap-x-4 gap-y-3 px-2 py-3">
      {cells.map((cell) => (
        <DataListItem key={cell.id} label={cell.column.columnDef.meta?.label ?? cell.column.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </DataListItem>
      ))}
    </DataList>
  );
}

/**
 * A narrow first column that, while columns are hidden to fit, opens a row on the fields it lost, as label and value
 * pairs. It shows only then: on a laptop, or once the reader picks All columns, it is gone. Put it first in
 * `columns`, beside the `meta.compact` ones.
 */
export function dataTableDetailsColumn<TData extends RowData>(): DataTableColumnDef<TData> {
  return {
    id: DETAILS_COLUMN_ID,
    size: 36,
    enableSorting: false,
    header: () => <span className="sr-only">Details</span>,
    cell: ({ row }) => <DetailsToggle row={row} />,
    meta: { expandedContent: (original) => <RowDetails original={original} /> },
  };
}
