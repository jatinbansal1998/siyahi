import { Children, type ReactNode } from "react";
import { cn } from "cn";
import { useSurface } from "@siyahi/ui/components/siyahi/siyahi-provider";

// Tailwind finds classes by scanning source, so each step is written out whole.
const COLUMNS = {
  1: "",
  2: "@2xl/panels:grid-cols-2",
  3: "@2xl/panels:grid-cols-3",
  4: "@2xl/panels:grid-cols-2 @5xl/panels:grid-cols-4",
} as const;

export interface PanelGridProps {
  /**
   * Blocks across from a 42rem grid, so three short ones fit a reading column (an article's 55rem); 4 goes two across
   * there and four from 64rem. Below 42rem they sit one under another.
   */
  columns?: keyof typeof COLUMNS | undefined;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * Data blocks side by side: chart cards, tables, a MetricStrip. On a ruled surface, the default, the grid is filled
 * with the card colour and a hairline parts the blocks across and down, with a rule above and below the grid and none
 * on its sides; open leaves whitespace between them, and card an 8px gap between boxes. Each block's bottom and end
 * edges carry its rules and the grid clips the ones on its own edges, so an empty cell at the end of a short last row
 * is a blank stretch of the sheet, ruled off like the rest. The theme numbers each block's card title 01, 02.
 */
export function PanelGrid({ columns = 2, children, className }: PanelGridProps) {
  const surface = useSurface();
  const ruled = surface === "ruled";
  return (
    // data-surface carries the surface this grid laid itself out for to the theme's CSS, which cannot read React
    // context: inside a dialog or popover, portaled out of the provider's element, the two would otherwise disagree.
    <div
      data-slot="panel-grid"
      data-surface={surface}
      className={cn("@container/panels", ruled && "overflow-clip border-y", className)}
    >
      <div
        className={cn(
          "grid grid-cols-1",
          COLUMNS[columns],
          ruled ? "-me-px -mb-px bg-card" : surface === "open" ? "gap-x-8 gap-y-6" : "gap-2",
        )}
      >
        {Children.map(children, (child) => (
          <div data-slot="panel" className={cn("min-w-0", ruled && "border-e border-b")}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
