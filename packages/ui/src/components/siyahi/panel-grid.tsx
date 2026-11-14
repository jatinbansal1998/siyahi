import { Children, type ReactNode } from "react";
import { cn } from "cn";

// Tailwind finds classes by scanning source, so each step is written out whole.
const COLUMNS = {
  1: "",
  2: "@2xl/panels:grid-cols-2",
  3: "@2xl/panels:grid-cols-3",
  4: "@2xl/panels:grid-cols-2 @5xl/panels:grid-cols-4",
} as const;
// A large monitor shows more blocks at once rather than wider ones: a third across from a 140rem grid (2240px) and a
// fourth from 180rem, when the grid holds that many, so a pair never leaves an empty column beside it.
const WIDE_THREE = "@min-[140rem]/panels:grid-cols-3";
const WIDE_FOUR = "@min-[180rem]/panels:grid-cols-4";

export interface PanelGridProps {
  /**
   * Blocks across from a 42rem grid, so three short ones fit a reading column (an article's 55rem); 4 goes two across
   * there and four from 64rem. Below 42rem they sit one under another. From 140rem a grid of 2 takes a third across,
   * and from 180rem a grid of 2 or 3 a fourth, when it holds that many blocks; 1 stays one.
   */
  columns?: keyof typeof COLUMNS | undefined;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * Data blocks side by side: chart cards, tables, a MetricStrip. Space parts the blocks, 16px across and 12px down,
 * with no box and no rule. The theme numbers each block's card title 01, 02.
 */
export function PanelGrid({ columns = 2, children, className }: PanelGridProps) {
  // toArray drops a block a page left out with `cond && <Card />`, which count would still count.
  const blocks = Children.toArray(children).length;
  const wide = cn(
    columns === 2 && blocks >= 3 && WIDE_THREE,
    (columns === 2 || columns === 3) && blocks >= 4 && WIDE_FOUR,
  );
  return (
    <div data-slot="panel-grid" className={cn("@container/panels", className)}>
      <div className={cn("grid grid-cols-1 gap-x-4 gap-y-3", COLUMNS[columns], wide)}>
        {Children.map(children, (child) => (
          <div data-slot="panel" className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
