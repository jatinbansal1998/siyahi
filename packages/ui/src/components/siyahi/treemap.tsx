import { useLayoutEffect, useRef, useState } from "react";
import { useFormat } from "@siyahi/ui/lib/format";
import { heat, layout } from "@siyahi/ui/lib/treemap";

export interface TreemapItem {
  name: string;
  /** Tile area, such as the holding's value. */
  weight: number;
  /** Signed change as a fraction; sets the heat. `null` when unknown: a muted tile marked "—". */
  change: number | null;
  /** Unique key when names repeat, such as one symbol held at two brokers. Defaults to `name`. */
  key?: string;
  /** Tiles of one group, such as a sector, sit together under the group's name. */
  group?: string;
}

export interface TreemapProps<T extends TreemapItem> {
  items: T[];
  height: number;
  /** The change, as a fraction, that takes the deepest heat step. Default 0.05 (±5%). */
  range?: number;
  /** Gets the item under the pointer, and null when the pointer leaves the map. */
  onHover?: (item: T | null) => void;
}

/** Holdings heat map: area by weight, colour by signed change, optionally grouped; hand-drawn SVG. */
export function Treemap<T extends TreemapItem>({ items, height, range = 0.05, onHover }: TreemapProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { pct } = useFormat();
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const { groups, tiles } = layout(items, width, height);
  const change = (value: number | null) =>
    value === null ? "—" : `${value > 0 ? "▲ " : value < 0 ? "▼ " : ""}${pct(Math.abs(value))}`;
  // Each label sits in a nested <svg>, which clips it to its tile or group row.
  return (
    <div ref={ref} data-slot="treemap" style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Treemap of holdings by weight and change"
        className="text-xs"
        onPointerLeave={() => onHover?.(null)}
      >
        {groups.map(({ group, ...box }) => (
          <svg key={group} {...box} data-slot="treemap-group">
            <text x={2} y={12} className="fill-muted-foreground font-medium">
              {group}
            </text>
          </svg>
        ))}
        {tiles.map(({ item, ...box }) => (
          <svg key={item.key ?? item.name} {...box} data-slot="treemap-tile" onPointerEnter={() => onHover?.(item)}>
            <rect width="100%" height="100%" rx={4} style={{ fill: heat(item.change, range) }} />
            {box.width > 56 && box.height > 36 && (
              <text x={8} y={18} className="fill-foreground">
                <tspan className="font-medium">{item.name}</tspan>
                <tspan x={8} dy={16}>
                  {change(item.change)}
                </tspan>
              </text>
            )}
          </svg>
        ))}
      </svg>
    </div>
  );
}
