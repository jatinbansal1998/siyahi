import { useEffect, useState, type ReactNode } from "react";
import { useDataTable } from "@siyahi/ui/components/registry/niko-table/core/data-table-context";

export interface DataTableFootnoteProps {
  /** One sentence on how to read the table, such as what each bar measures. */
  children: ReactNode;
}

/**
 * A full-width last row, inside `DataTable` after its body, that explains the table's encoding. On a table wider than
 * its card the note stays put at the card's width while the columns scroll under it.
 */
export function DataTableFootnote({ children }: DataTableFootnoteProps) {
  const { table, scrollContainer } = useDataTable();
  const [viewport, setViewport] = useState<number>();
  useEffect(() => {
    if (!scrollContainer) return;
    const observer = new ResizeObserver(() => setViewport(scrollContainer.clientWidth));
    observer.observe(scrollContainer);
    return () => observer.disconnect();
  }, [scrollContainer]);
  return (
    <tfoot data-slot="data-table-footnote">
      <tr className="border-t">
        <td colSpan={table.getVisibleLeafColumns().length} className="p-0">
          <p
            className="sticky left-0 px-2 py-3 text-sm whitespace-normal text-muted-foreground"
            style={{ maxWidth: viewport }}
          >
            {children}
          </p>
        </td>
      </tr>
    </tfoot>
  );
}
