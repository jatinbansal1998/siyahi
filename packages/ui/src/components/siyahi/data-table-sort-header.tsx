import type { RowData } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@siyahi/ui/components/ui/button";
import {
  DataTableColumnHeader,
  useColumnHeaderContext,
} from "@siyahi/ui/components/registry/niko-table/components/data-table-column-header";
import { registerComponentFeatures } from "@siyahi/ui/components/registry/niko-table/config/feature-detection";
import { useDerivedColumnTitle } from "@siyahi/ui/components/registry/niko-table/hooks/use-derived-column-title";

/**
 * A column header that sorts on one click, largest (or Z) first, as shadcn's
 * data table guide draws it: a ghost button with the direction's arrow. The
 * column menu takes two clicks for the same. Use it as a column's `header`:
 * `header: () => <DataTableSortHeader />`; the title defaults to `meta.label`.
 */
export function DataTableSortHeader<TData extends RowData>({ title }: { title?: string }) {
  const { column } = useColumnHeaderContext<TData, unknown>(true);
  const label = useDerivedColumnTitle(column, column.id, title);
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <DataTableColumnHeader>
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => column.toggleSorting(sorted !== "desc")}>
        {label}
        <Icon />
      </Button>
    </DataTableColumnHeader>
  );
}

// DataTableRoot turns sorting on only for header components it knows by name.
DataTableSortHeader.displayName = "DataTableSortHeader";
registerComponentFeatures(DataTableSortHeader.displayName, { enableSorting: true });
