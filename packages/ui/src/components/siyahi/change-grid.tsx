import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@siyahi/ui/components/ui/table";
import { useFormat } from "@siyahi/ui/lib/format";
import { heat } from "@siyahi/ui/lib/heat";

export interface ChangeGridRow {
  label: string;
  /** One figure per column, in column order; null where there is none, such as a month still to come. NaN counts as none. */
  values: readonly (number | null)[];
  /** The row's total as the page works it out: monthly returns compound rather than add. Leave it out for no total. */
  total?: number | null | undefined;
  /** Unique key when labels repeat. Defaults to `label`. */
  key?: string | undefined;
}

export interface ChangeGridProps {
  /** The column heads, such as the months of a financial year. */
  columns: readonly string[];
  rows: readonly ChangeGridRow[];
  /** "pct" takes fractions, 0.025 for 2.5%; "money" takes amounts, written short in one unit. */
  format?: "pct" | "money" | undefined;
  /** The change that takes the deepest tint, as a size. Defaults to the grid's largest, totals aside. */
  range?: number | undefined;
  /** Heads the total column, which draws when any row or the footer has a total. */
  totalLabel?: string | undefined;
  /**
   * A row under the grid with each column's figure as the page works it out, such as each year's total or average
   * when the columns are years; its `total` sits under the total column. Untinted, as totals are.
   */
  footer?: ChangeGridRow | undefined;
  /** Names the table for a screen reader, such as "Monthly sales growth by year". */
  label: string;
  className?: string | undefined;
}

const MINUS = "−";

/** A figure the grid can draw: anything that is not a finite number, NaN included, is no figure at all. */
const known = (value: number | null | undefined): number | null =>
  value != null && Number.isFinite(value) ? value : null;

/**
 * Signed changes laid out rows by columns, such as each month of each year, every cell tinted by its sign and size
 * as a Treemap tile is and written with its sign, with an optional total per row. The figure is always written, so
 * the tint only helps the eye find the large months.
 */
export function ChangeGrid({
  columns,
  rows,
  format = "pct",
  range,
  totalLabel = "Total",
  footer,
  label,
  className,
}: ChangeGridProps) {
  const f = useFormat();
  const sizes = rows.flatMap(({ values }) => values.flatMap((value) => known(value) ?? []).map(Math.abs));
  const deepest = known(range) ?? Math.max(0, ...sizes);
  const write = (value: number | null) => {
    if (value === null) return "—";
    const size = format === "money" ? f.moneyCompact(Math.abs(value), deepest) : f.pct(Math.abs(value));
    return `${value > 0 ? "+" : value < 0 ? MINUS : ""}${size}`;
  };
  const totals = [...rows, footer].some((row) => row?.total !== undefined);
  // A total is on a different scale from the cells it sums, so it takes no tint.
  const untinted = (key: string, value: number | null | undefined) => (
    <TableCell key={key} className="text-right font-mono font-medium tabular-nums">
      {write(known(value))}
    </TableCell>
  );
  return (
    // Separate cells with a 2px gap, so each tint reads as its own swatch rather than one band per row.
    <Table aria-label={label} data-slot="change-grid" className={cn("border-separate border-spacing-0.5", className)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="sticky left-0 bg-card">
            <span className="sr-only">Row</span>
          </TableHead>
          {columns.map((column) => (
            <TableHead key={column} className="text-right">
              {column}
            </TableHead>
          ))}
          {totals && <TableHead className="text-right">{totalLabel}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key ?? row.label} className="border-0 hover:bg-transparent">
            {/* The row's label stays in view while a phone scrolls the months under it. */}
            <TableHead scope="row" className="sticky left-0 bg-card font-medium">
              {row.label}
            </TableHead>
            {columns.map((column, index) => {
              const value = known(row.values[index]);
              return (
                <TableCell
                  key={column}
                  data-slot="change-grid-cell"
                  className={cn(
                    "rounded-sm text-right font-mono tabular-nums",
                    value === null && "text-muted-foreground",
                  )}
                  style={{ backgroundColor: heat(value, deepest) }}
                >
                  {write(value)}
                </TableCell>
              );
            })}
            {totals && untinted("total", row.total)}
          </TableRow>
        ))}
      </TableBody>
      {footer && (
        <TableFooter className="bg-transparent">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead scope="row" className="sticky left-0 bg-card font-medium">
              {footer.label}
            </TableHead>
            {columns.map((column, index) => untinted(column, footer.values[index]))}
            {totals && untinted("total", footer.total)}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
