import { cn } from "cn";
import { fit, textWidth } from "@siyahi/ui/lib/fit-text";
import { useFormat } from "@siyahi/ui/lib/format";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

export interface SlopeItem {
  name: string;
  /** The value on the left: before, or the comparison such as an index's weight. */
  from: number;
  /** The value on the right: after, or our own figure. */
  to: number;
  /** Unique key when names repeat. Defaults to `name`. */
  key?: string;
}

export interface SlopeChartProps {
  items: readonly SlopeItem[];
  /** Heads the left side, such as "Nifty 50" or "2025". */
  fromLabel: string;
  /** Heads the right side, such as "Portfolio" or "2026". */
  toLabel: string;
  /** Keys (or names) of the items to draw in the accent colour; the rest stay grey. */
  highlighted?: readonly string[];
  /** Writes each end's value; useFormat().pct by default. */
  valueFormatter?: (value: number) => string;
  className?: string;
}

const ROW = 18;
const TOP = 32;
const BOTTOM = 8;
const VALUE_WIDTH = 64;
const GAP = 12;
const NONE: readonly string[] = [];

/**
 * Pushes labels apart so none sits closer than `gap` to the next, keeping their order and staying inside [min, max]:
 * down from the top first, then back up from the bottom when the last one ran past it.
 */
export function spread(ys: readonly number[], gap: number, min: number, max: number): number[] {
  const order = ys.map((y, index) => ({ y, index })).toSorted((a, b) => a.y - b.y);
  let floor = min;
  for (const label of order) {
    label.y = Math.max(label.y, floor);
    floor = label.y + gap;
  }
  let ceiling = max;
  for (const label of order.toReversed()) {
    label.y = Math.min(label.y, ceiling);
    ceiling = label.y - gap;
  }
  const placed = Array.from({ length: ys.length }, () => 0);
  for (const { y, index } of order) placed[index] = y;
  return placed;
}

/**
 * Each item as a line from its value on the left to its value on the right, so rises, falls and crossings read at a
 * glance: allocation against a target, a weight against an index's, or one year against the next. Lines are grey and
 * the page picks the few to draw in the accent; names sit on the left, values at both ends, nudged apart when close.
 */
export function SlopeChart({
  items,
  fromLabel,
  toLabel,
  highlighted = NONE,
  valueFormatter,
  className,
}: SlopeChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const { pct } = useFormat();
  const format = valueFormatter ?? ((value: number) => pct(value));
  // Room for about one and a half label rows per item, so labels can sit beside their own ends.
  const height = TOP + Math.max(items.length * ROW * 1.5, 180) + BOTTOM;
  const values = items.flatMap(({ from, to }) => [from, to]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const y = (value: number) =>
    high === low
      ? (TOP + height - BOTTOM) / 2
      : TOP + ((high - value) / (high - low)) * (height - TOP - BOTTOM - ROW) + ROW / 2;
  // Names and the left values take what the lines and the right values leave, up to 240px; the lines keep at least
  // 96px, so a phone gives the names most of its width.
  const left = Math.min(Math.max(Math.round(width * 0.45), width - VALUE_WIDTH - 96), 240);
  const right = width - VALUE_WIDTH;
  const lefts = spread(
    items.map(({ from }) => y(from)),
    ROW,
    TOP + ROW / 2,
    height - BOTTOM - ROW / 2,
  );
  const rights = spread(
    items.map(({ to }) => y(to)),
    ROW,
    TOP + ROW / 2,
    height - BOTTOM - ROW / 2,
  );
  const marked = new Set(highlighted);
  const isMarked = (item: SlopeItem) => marked.has(item.key ?? item.name);
  // Highlighted lines draw last, so no grey line crosses over them.
  const order = items
    .map((item, index) => ({ item, index }))
    .toSorted((a, b) => Number(isMarked(a.item)) - Number(isMarked(b.item)));
  return (
    <div ref={ref} data-slot="slope-chart" className={cn("w-full max-w-2xl", className)} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          // The list below says the same in words; the lines only add the picture.
          aria-hidden="true"
          className="text-xs"
        >
          <text x={left} y={14} textAnchor="end" className="fill-muted-foreground font-medium">
            {fromLabel}
          </text>
          <text x={right} y={14} className="fill-muted-foreground font-medium">
            {toLabel}
          </text>
          {[left, right].map((x) => (
            <line key={x} x1={x} x2={x} y1={TOP - 6} y2={height - BOTTOM} className="stroke-border" />
          ))}
          {order.map(({ item, index }) => {
            const strong = isMarked(item);
            const ink = strong ? "var(--chart-1)" : "var(--muted-foreground)";
            const a = y(item.from);
            const b = y(item.to);
            return (
              <g key={item.key ?? item.name} data-slot="slope-chart-item" data-highlighted={strong || undefined}>
                <title>{`${item.name}: ${format(item.from)} to ${format(item.to)}`}</title>
                <line x1={left + GAP} y1={a} x2={right - GAP} y2={b} stroke={ink} strokeWidth={strong ? 2.5 : 1.5} />
                <circle cx={left + GAP} cy={a} r={3} fill={ink} />
                <circle cx={right - GAP} cy={b} r={3} fill={ink} />
                <text
                  x={left - 4}
                  y={lefts[index]}
                  dominantBaseline="central"
                  textAnchor="end"
                  className={cn("tabular-nums", strong ? "fill-foreground font-medium" : "fill-muted-foreground")}
                >
                  {fit(item.name, left - 8 - textWidth(` ${format(item.from)}`))} {format(item.from)}
                </text>
                <text
                  x={right + 4}
                  y={rights[index]}
                  dominantBaseline="central"
                  className={cn("tabular-nums", strong ? "fill-foreground font-medium" : "fill-muted-foreground")}
                >
                  {format(item.to)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <ul className="sr-only" aria-label={`${fromLabel} against ${toLabel}`}>
        {items.map((item) => (
          <li key={item.key ?? item.name}>
            {`${item.name}: ${fromLabel} ${format(item.from)}, ${toLabel} ${format(item.to)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
