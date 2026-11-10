import { cn } from "cn";
import { Delta, type DeltaProps } from "@siyahi/ui/components/siyahi/delta";

export interface ChangeBarProps {
  /** The signed change, as Delta takes it. */
  value: number;
  /** The column's largest change by size: Math.max(...rows.map((row) => Math.abs(row.change))). */
  max: number;
  /**
   * Draws the bar from a centre line, losses leftward and gains rightward. Pass it when the column holds both signs:
   * rows.some((row) => row.change < 0) && rows.some((row) => row.change > 0).
   */
  diverging?: boolean;
  format?: DeltaProps["format"];
  className?: string;
}

/**
 * A table cell's change as a Delta over a 3px bar whose length is the change's size against the column's largest, so
 * the rows rank by eye. The bar is neutral because it shows size; the Delta above it carries the gain or loss colour.
 */
export function ChangeBar({ value, max, diverging = false, format, className }: ChangeBarProps) {
  const share = max > 0 ? Math.min(1, Math.abs(value) / max) : 0;
  const half = diverging ? 50 : 100;
  const side = diverging && value < 0 ? "right" : "left";
  return (
    <div data-slot="change-bar" className={cn("flex w-full flex-col items-end gap-1.5", className)}>
      <Delta value={value} format={format} className="font-medium" />
      <div aria-hidden="true" className="relative h-0.75 w-full bg-muted">
        <div
          data-slot="change-bar-fill"
          className="absolute inset-y-0 bg-foreground"
          style={{ [side]: diverging ? "50%" : 0, width: `${share * half}%` }}
        />
        {diverging && <div className="absolute -inset-y-1 left-1/2 w-px -translate-x-1/2 bg-muted-foreground" />}
      </div>
    </div>
  );
}
