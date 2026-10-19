import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { useLayoutEffect, useRef, useState } from "react";
import { useFormat } from "@siyahi/ui/lib/format";

export interface TreemapItem {
  name: string;
  /** Tile area, such as the holding's value. */
  weight: number;
  /** Signed change as a fraction; sets the heat. */
  change: number;
}

// Each step mixes more of --positive or --negative into the card colour.
// oklab, not oklch: the card is achromatic, and an oklch mix would swing the
// hue from green through orange on its way to it.
const STEPS: [number, number][] = [
  [0.05, 60],
  [0.03, 48],
  [0.02, 36],
  [0.01, 24],
  [0, 12],
];

function heat(change: number): string {
  if (change === 0) return "var(--muted)";
  const mix = STEPS.find(([floor]) => Math.abs(change) >= floor)?.[1] ?? 12;
  return `color-mix(in oklab, var(${change > 0 ? "--positive" : "--negative"}) ${mix}%, var(--card))`;
}

/** Holdings heat map: area by weight, colour by signed change, hand-drawn SVG. */
export function Treemap({ items, height }: { items: TreemapItem[]; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { pct } = useFormat();
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const root = hierarchy<{ children?: TreemapItem[] } & Partial<TreemapItem>>({ children: items }).sum(
    (d) => d.weight ?? 0,
  );
  const leaves = treemap<typeof root.data>().size([width, height]).paddingInner(2).tile(treemapSquarify)(root).leaves();
  return (
    <div ref={ref} data-slot="treemap" style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Treemap of holdings by weight and change"
        className="text-xs"
      >
        {leaves.map(({ data, x0, y0, x1, y1 }) => (
          <g key={data.name} transform={`translate(${x0},${y0})`}>
            <rect width={x1 - x0} height={y1 - y0} rx={4} style={{ fill: heat(data.change ?? 0) }} />
            {x1 - x0 > 56 && y1 - y0 > 36 && (
              <text x={8} y={18} className="fill-foreground">
                <tspan className="font-medium">{data.name}</tspan>
                <tspan x={8} dy={16}>
                  {(data.change ?? 0) > 0 ? "▲ " : (data.change ?? 0) < 0 ? "▼ " : ""}
                  {pct(Math.abs(data.change ?? 0))}
                </tspan>
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
