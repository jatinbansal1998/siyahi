import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { useFormat } from "@siyahi/ui/lib/format";
import { cn } from "cn";
import { HEAT_STEPS, heat, heatFill, heatRange, layout } from "@siyahi/ui/lib/treemap";

export interface TreemapItem {
  name: string;
  /** Tile area, such as the holding's value. Zero, negative and non-finite weights draw no tile. */
  weight: number;
  /** Signed change as a fraction; sets the heat. `null` when unknown: a muted tile marked "—". */
  change: number | null;
  /** Unique key when names repeat, such as one symbol held at two brokers. Defaults to `name`. */
  key?: string;
  /** Tiles of one group, such as a sector, sit together under the group's name, even a group of one. */
  group?: string;
}

export interface TreemapProps<T extends TreemapItem> {
  items: T[];
  height: number;
  /** ±range: the change, as a fraction, that takes the deepest heat step. Default 0.05 (±5%); a range that is not a positive number uses the default. */
  range?: number;
  /** Gets the item under the pointer, and null when the pointer moves onto a group's name or leaves the map. */
  onHover?: (item: T | null) => void;
  /** The selected item, matched by key, whose tile carries a ring. Pass back what onSelect gave. */
  selected?: T | null;
  /**
   * Gets the item whose tile is tapped or clicked, and null when the selected
   * tile is tapped again or a tap lands anywhere else. On a touch screen, which
   * has no hover, this is how a reader gets a tile's figures.
   */
  onSelect?: (item: T | null) => void;
}

/** Holdings heat map: area by weight, colour by signed change, optionally grouped; hand-drawn SVG. */
export function Treemap<T extends TreemapItem>({ items, height, range, onHover, selected, onSelect }: TreemapProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const selectedKey = selected ? (selected.key ?? selected.name) : null;
  const { pct } = useFormat();
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  // A tap on a tile is handled by the tile's own click; any other tap clears.
  const clearOutside = useEffectEvent((event: PointerEvent) => {
    const tile = event.target instanceof Element ? event.target.closest('[data-slot="treemap-tile"]') : null;
    if (!ref.current?.contains(tile)) onSelect?.(null);
  });
  useEffect(() => {
    if (selectedKey === null) return;
    const onPointerDown = (event: PointerEvent) => clearOutside(event);
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedKey]);
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
          <svg key={group} {...box} data-slot="treemap-group" onPointerEnter={() => onHover?.(null)}>
            <rect width="100%" height="100%" fill="none" pointerEvents="all" />
            <text x={2} y={12} className="fill-muted-foreground font-medium">
              {group}
            </text>
          </svg>
        ))}
        {tiles.map(({ item, ...box }) => {
          const key = item.key ?? item.name;
          return (
            <svg
              key={key}
              {...box}
              data-slot="treemap-tile"
              data-selected={key === selectedKey || undefined}
              onPointerEnter={() => onHover?.(item)}
              onClick={() => onSelect?.(key === selectedKey ? null : item)}
            >
              <rect width="100%" height="100%" rx={4} style={{ fill: heat(item.change, range) }} />
              {key === selectedKey && (
                <rect
                  x={1}
                  y={1}
                  width={box.width - 2}
                  height={box.height - 2}
                  rx={3}
                  fill="none"
                  strokeWidth={2}
                  className="stroke-foreground"
                />
              )}
              {box.width > 56 && box.height > 36 && (
                <text x={8} y={18} className="fill-foreground">
                  <tspan className="font-medium">{item.name}</tspan>
                  <tspan x={8} dy={16}>
                    {change(item.change)}
                  </tspan>
                </text>
              )}
            </svg>
          );
        })}
      </svg>
    </div>
  );
}

// Painted with an SVG fill, as the tiles are, so a swatch and a tile of one step are the same colour.
function Swatch({ label, fill }: { label: string; fill: string }) {
  return (
    <svg data-slot="treemap-legend-swatch" className="h-3 flex-1">
      <title>{label}</title>
      <rect width="100%" height="100%" rx={2} style={{ fill }} />
    </svg>
  );
}

export interface TreemapLegendProps {
  /** The Treemap's own range, so each swatch matches its tiles. */
  range?: number;
  className?: string;
}

/** The Treemap's colour scale under the map: five steps of loss, no change, five steps of gain, deepest at the ends. */
export function TreemapLegend({ range, className }: TreemapLegendProps) {
  const { pct } = useFormat();
  const step = heatRange(range) / HEAT_STEPS;
  // Whole percentages print without a decimal; a step such as 1.2% keeps one.
  const digits = Number.isInteger(Math.round(step * 1e6) / 1e4) ? 0 : 1;
  const over = pct(step * (HEAT_STEPS - 1), digits);
  const swatch = (side: "positive" | "negative", n: number) => {
    const word = side === "positive" ? "up" : "down";
    const label =
      n === HEAT_STEPS ? `${word} over ${over}` : `${word} ${pct(step * (n - 1), digits)}–${pct(step * n, digits)}`;
    return <Swatch key={`${side}-${n}`} label={label} fill={heatFill(side, n)} />;
  };
  const steps = Array.from({ length: HEAT_STEPS }, (_, i) => i + 1);
  return (
    <div
      data-slot="treemap-legend"
      className={cn("flex w-full max-w-xs flex-col gap-1 text-xs text-muted-foreground", className)}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {steps.toReversed().map((n) => swatch("negative", n))}
        <Swatch label="no change, or unknown" fill={heat(null)} />
        {steps.map((n) => swatch("positive", n))}
      </div>
      <div className="flex justify-between gap-2 tabular-nums">
        <span>▼ over {over}</span>
        <span>{pct(step, digits)} a step</span>
        <span>▲ over {over}</span>
      </div>
    </div>
  );
}
