// The reader's switch between a compact table's key columns and all of them.

import { Button } from "@siyahi/ui/components/ui/button";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";

/** Renders only while some columns are hidden to fit, or the reader has shown them all. */
export function DataTableCompactColumnsToggle() {
  const { compactColumns } = useDataTable();
  if (!compactColumns) return null;
  const { collapsed, setCollapsed } = compactColumns;
  return (
    <Button variant="outline" size="sm" aria-pressed={!collapsed} onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? `All columns (+${compactColumns.hidden.size})` : "Key columns"}
    </Button>
  );
}
