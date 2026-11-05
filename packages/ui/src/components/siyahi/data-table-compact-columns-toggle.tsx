// The reader's switch between a compact table's key columns and all of them.

import { Button } from "@siyahi/ui/components/ui/button";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";

/** Renders only while the table is compact and some column sets `meta.compact`. */
export function DataTableCompactColumnsToggle() {
  const { compactColumns } = useDataTable();
  if (!compactColumns) return null;
  const { collapsed, setCollapsed } = compactColumns;
  return (
    <Button variant="outline" size="sm" aria-pressed={!collapsed} onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? "All columns" : "Key columns"}
    </Button>
  );
}
