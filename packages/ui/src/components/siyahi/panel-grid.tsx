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
 * Data blocks side by side: chart cards, tables, a MetricStrip. On an open surface, the default, space parts the
 * blocks: 24px across and 16px down, no box and no rule. A card surface sets them 8px apart, each in its own box. The
 * theme numbers each block's card title 01, 02.
 */
export function PanelGrid({ columns = 2, children, className }: PanelGridProps) {
  const surface = useSurface();
  // toArray drops a block a page left out with `cond && <Card />`, which count would still count.
  const blocks = Children.toArray(children).length;
  const wide = cn(
    columns === 2 && blocks >= 3 && WIDE_THREE,
    (columns === 2 || columns === 3) && blocks >= 4 && WIDE_FOUR,
  );
  return (
    // data-surface carries the surface this grid laid itself out for to the theme's CSS, which cannot read React
    // context: inside a dialog or popover, portaled out of the provider's element, the two would otherwise disagree.
    <div data-slot="panel-grid" data-surface={surface} className={cn("@container/panels", className)}>
      <div className={cn("grid grid-cols-1", COLUMNS[columns], wide, surface === "open" ? "gap-x-6 gap-y-4" : "gap-2")}>
        {Children.map(children, (child) => (
          <div data-slot="panel" className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
