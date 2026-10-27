import { Children, type ReactNode } from "react";
import { cn } from "cn";
import { useSurface } from "@siyahi/ui/components/siyahi/siyahi-provider";

// Tailwind finds classes by scanning source, so each step is written out whole.
const COLUMNS = {
  1: "",
  2: "@2xl/panels:grid-cols-2",
  3: "@2xl/panels:grid-cols-2 @5xl/panels:grid-cols-3",
  4: "@2xl/panels:grid-cols-2 @5xl/panels:grid-cols-4",
} as const;

export interface PanelGridProps {
  /** Blocks across on a wide page; two on a medium one, and one on a phone. */
  columns?: keyof typeof COLUMNS;
  children: ReactNode;
  className?: string;
}

/**
 * Data blocks side by side: chart cards, tables, a MetricStrip. On a ruled surface a hairline parts them across and
 * down, with a rule above and below the grid; open leaves whitespace between them, and card a gap between boxes.
 * Each block's left and top edges carry its rules, and the grid clips the ones on its own edges.
 */
export function PanelGrid({ columns = 2, children, className }: PanelGridProps) {
  const surface = useSurface();
  const ruled = surface === "ruled";
  return (
    <div data-slot="panel-grid" className={cn("@container/panels", ruled && "overflow-hidden border-y", className)}>
      <div
        className={cn(
          "grid grid-cols-1",
          COLUMNS[columns],
          ruled ? "-mt-px -ml-px" : surface === "open" ? "gap-x-8 gap-y-6" : "gap-4",
        )}
      >
        {Children.map(children, (child) => (
          <div data-slot="panel" className={cn("min-w-0", ruled && "border-t border-l")}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
