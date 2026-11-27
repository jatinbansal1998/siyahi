import type { RowData } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { Button } from "@siyahi/ui/components/ui/button";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";
import { isGlobalFilterActive } from "@siyahi/ui/components/registry/niko-table/lib/filter-functions";
import { formatLabel } from "@siyahi/ui/components/registry/niko-table/lib/format";
import type { DataTableColumn } from "@siyahi/ui/components/registry/niko-table/types";

interface Chip {
  key: string;
  text: string;
  remove: () => void;
}

// A faceted filter stores { value: string | string[] }; an older one stored the bare array.
function selected(filter: unknown): string[] {
  const value = filter && typeof filter === "object" && "value" in filter ? filter.value : filter;
  return (Array.isArray(value) ? value : [value]).filter((item) => item != null).map(String);
}

// The filter with one value taken out, kept in the shape it was stored in; none left clears it.
function without(filter: unknown, item: string): unknown {
  const rest = selected(filter).filter((value) => value !== item);
  if (!rest.length) return undefined;
  return Array.isArray(filter) ? rest : { ...(filter as object), value: rest };
}

// The words the faceted filter's menu shows for a value, so a chip reads as the option the reader ticked.
function optionLabel<TData extends RowData>(column: DataTableColumn<TData>, value: string): string {
  const meta = column.columnDef.meta;
  const option = meta?.options?.find((item) => item.value === value);
  if (option) return option.label;
  if (meta?.formatOptionLabel) return meta.formatOptionLabel(value);
  return meta?.autoOptionsFormat === false ? value : formatLabel(value);
}

/**
 * What the table's search and filters are set to, one chip per value, each removable, and "Reset filters". Renders
 * nothing while no filter is set. For a table toolbar, after the filters; `DataTableRowCount` says how many rows remain.
 */
export function DataTableActiveFilters<TData extends RowData>() {
  const { table } = useDataTable<TData>();
  const search: unknown = table.state.globalFilter;
  const chips: Chip[] = [];
  if (isGlobalFilterActive(search)) {
    chips.push({ key: "search", text: `Search: ${String(search)}`, remove: () => table.setGlobalFilter("") });
  }
  for (const { id, value } of table.state.columnFilters) {
    const column = table.getColumn(id);
    if (!column) continue;
    for (const item of selected(value)) {
      chips.push({
        key: `${id}:${item}`,
        text: `${column.columnDef.meta?.label ?? formatLabel(id)}: ${optionLabel(column, item)}`,
        remove: () => column.setFilterValue(without(value, item)),
      });
    }
  }
  if (!chips.length) return null;
  return (
    <div data-slot="data-table-active-filters" className="flex basis-full flex-wrap items-center gap-2">
      {chips.map(({ key, text, remove }) => (
        <Button key={key} variant="outline" size="xs" aria-label={`Remove ${text}`} onClick={remove}>
          {text}
          <XIcon data-icon="inline-end" />
        </Button>
      ))}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          table.resetColumnFilters();
          table.setGlobalFilter("");
        }}
      >
        Reset filters
      </Button>
    </div>
  );
}
