import { useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  CartesianGrid,
  DefaultZIndexes,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZIndexLayer,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siyahi/ui/components/ui/card";
import { ChartContainer } from "@siyahi/ui/components/ui/chart";
import { linearTicks, logTicks, placeLabels, type Box, type LabelType } from "@siyahi/ui/lib/scatter";

export interface ScatterPoint {
  name: string;
  /** Across. On a log axis a point at or under zero is not drawn. */
  x: number;
  /** Up. `null` when unknown: the point is not drawn, so say on the page how many are missing. */
  y: number | null;
  /** Unique key when names repeat, such as one product sold in two regions. Defaults to `name`. */
  key?: string;
  /** A weight, such as a holding's value: the dot's area follows it. Give every point a size, or none. */
  size?: number;
}

/** Splits the plot into four at a value on each axis, such as zero, with an optional name in each corner. */
export interface ScatterQuadrants {
  x: number;
  y: number;
  labels?: { topLeft?: string; topRight?: string; bottomLeft?: string; bottomRight?: string };
}

/** One tooltip row: a label and its figure, such as ["Sales", "₹9.8L"]. */
export type ScatterDetail = readonly [label: string, value: string];

export interface ScatterChartCardProps<T extends ScatterPoint> {
  title: ReactNode;
  description?: ReactNode;
  /** A scope badge or a toggle, top right of the card. */
  action?: ReactNode;
  /** Most important first: earlier points take the labels. */
  points: T[];
  /** Height of the plot, in pixels. */
  height: number;
  /** What the x axis measures, under it, such as "Share of sales". */
  xLabel: string;
  /** What the y axis measures, beside it, such as "Growth on last year". */
  yLabel: string;
  /** "log" spreads values across powers of ten, for sizes that run from tiny to large. */
  xScale?: "linear" | "log";
  /** The x ticks and the tooltip's x figure. Defaults to the locale's numbers. */
  xFormatter?: (value: number) => string;
  /** The y ticks and the tooltip's y figure. Defaults to the locale's numbers. */
  yFormatter?: (value: number) => string;
  /** How many points get their name beside the dot, at most; a name with no free spot is left to the tooltip. */
  labels?: number;
  /** The tooltip's rows under the point's name, and what a screen reader hears. Defaults to the two axes' figures. */
  details?: (point: T) => readonly ScatterDetail[];
  /** The point that carries a ring, matched by key; pass back what onSelect gave. */
  selected?: T | null;
  /** Gets a tapped or keyed point, and null on a second tap, Escape or a tap on the plot. */
  onSelect?: (point: T | null) => void;
  /** Lines under the chart, such as a caption or how many points are not drawn. */
  footer?: ReactNode;
  /** Dashed lines at a value on each axis, splitting the plot into four, and the corners' names. */
  quadrants?: ScatterQuadrants;
  /** Names the size in the tooltip, such as "Value". Defaults to "Size". */
  sizeLabel?: string;
  /** The tooltip's size figure. Defaults to the locale's numbers. */
  sizeFormatter?: (value: number) => string;
}

const RADIUS = 5;
// The largest sized dot; the smallest stays big enough to see and to tap.
const MAX_RADIUS = 20;
const MIN_RADIUS = 3;
const EDGE = 1.5;
// A sized dot is a tint inside its full-colour edge, so overlapping dots show through each other.
const SIZED_FILL = 0.3;
const TICK = { className: "fill-muted-foreground font-mono" };
const AXIS_TITLE = "fill-muted-foreground text-xs";
const keyOf = (point: ScatterPoint) => point.key ?? point.name;

/** Two measures per item as dots, such as size against growth, with the leading names beside their dots. */
export function ScatterChartCard<T extends ScatterPoint>({
  title,
  description,
  action,
  points,
  height,
  xLabel,
  yLabel,
  xScale = "linear",
  xFormatter,
  yFormatter,
  labels = 12,
  details,
  selected = null,
  onSelect,
  footer,
  quadrants,
  sizeLabel = "Size",
  sizeFormatter,
}: ScatterChartCardProps<T>) {
  const { numberLocale } = useLocale();
  const plotRef = useRef<HTMLDivElement>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  // The dot the keyboard is on. Recharts swaps the dots' elements when the chart re-renders, which drops focus, so
  // it goes back to this dot after each render until focus leaves the chart.
  const keyed = useRef<string | null>(null);
  useEffect(() => {
    const key = keyed.current;
    if (key === null) return;
    const frame = requestAnimationFrame(() => {
      const dot = plotRef.current?.querySelector<SVGElement>(`[data-key="${CSS.escape(key)}"]`);
      if (dot && document.activeElement !== dot) dot.focus();
    });
    return () => cancelAnimationFrame(frame);
  });
  const onBlur = (event: FocusEvent) => {
    if (plotRef.current?.contains(event.relatedTarget)) return;
    // A dot swapped out by a re-render leaves the page; one the reader left behind stays on it.
    const left = event.target;
    requestAnimationFrame(() => {
      if (left.isConnected) keyed.current = null;
    });
  };
  const formatX = useMemo(() => xFormatter ?? new Intl.NumberFormat(numberLocale).format, [xFormatter, numberLocale]);
  const formatY = useMemo(() => yFormatter ?? new Intl.NumberFormat(numberLocale).format, [yFormatter, numberLocale]);
  const formatSize = useMemo(
    () => sizeFormatter ?? new Intl.NumberFormat(numberLocale).format,
    [sizeFormatter, numberLocale],
  );
  const drawn = useMemo(
    () =>
      points.filter(
        (p) => p.y !== null && Number.isFinite(p.y) && Number.isFinite(p.x) && (xScale === "linear" || p.x > 0),
      ),
    [points, xScale],
  );
  // Arrow keys walk the dots left to right, as the eye reads the plot.
  const order = useMemo(() => drawn.toSorted((a, b) => a.x - b.x || (a.y ?? 0) - (b.y ?? 0)), [drawn]);
  // Area, not radius, follows size, so a holding twice as large has twice the ink.
  const largest = Math.max(0, ...drawn.map((p) => p.size ?? 0));
  const radiusOf = (p: ScatterPoint) =>
    p.size === undefined || largest <= 0
      ? RADIUS
      : Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(Math.max(0, p.size) / largest));
  // The largest dots draw first, so a small one is never hidden under a big one.
  const painted = largest > 0 ? drawn.toSorted((a, b) => (b.size ?? 0) - (a.size ?? 0)) : drawn;
  // The axes reach the quadrants' split even when every point sits on one side of it.
  const xs = [
    ...drawn.map((p) => p.x),
    ...(quadrants && (xScale === "linear" || quadrants.x > 0) ? [quadrants.x] : []),
  ];
  const ys = [...drawn.map((p) => p.y ?? 0), ...(quadrants ? [quadrants.y] : [])];
  const xTicks = xScale === "log" ? logTicks(Math.min(...xs), Math.max(...xs)) : undefined;
  const yTicks = linearTicks(Math.min(...ys), Math.max(...ys));
  const crossesZero = ys.some((y) => y < 0) && ys.some((y) => y > 0);
  const selectedKey = selected ? keyOf(selected) : null;
  const rows =
    details ??
    ((p: T): ScatterDetail[] => [
      [xLabel, formatX(p.x)],
      [yLabel, p.y === null ? "—" : formatY(p.y)],
      ...(p.size === undefined ? [] : [[sizeLabel, formatSize(p.size)] as const]),
    ]);
  const first = order[0];
  const focusKey = order.some((p) => keyOf(p) === focusedKey)
    ? focusedKey
    : (selectedKey ?? (first ? keyOf(first) : null));
  const onKeyDown = (event: KeyboardEvent, point: T) => {
    if (!onSelect) return;
    const key = keyOf(point);
    keyed.current = key;
    const at = order.findIndex((p) => keyOf(p) === key);
    const steps: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowUp: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at - 1,
      Home: 0,
      End: order.length - 1,
    };
    const to = steps[event.key];
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(key === selectedKey ? null : point);
    } else if (event.key === "Escape") {
      onSelect(null);
    } else if (to !== undefined) {
      event.preventDefault();
      const next = order[Math.max(0, Math.min(order.length - 1, to))];
      if (!next) return;
      keyed.current = keyOf(next);
      setFocusedKey(keyOf(next));
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {/* A tap on a dot is handled by the dot, which stops it here; any other tap on the plot clears. */}
        <div
          ref={plotRef}
          data-slot="scatter-chart"
          role={onSelect ? "group" : "img"}
          aria-label={`${xLabel} against ${yLabel}`}
          onClick={() => onSelect?.(null)}
          onBlur={onBlur}
        >
          <ChartContainer config={{}} className="aspect-auto w-full" style={{ height }}>
            <ScatterChart margin={{ top: 12, right: 16, left: 0 }} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                scale={xScale}
                domain={
                  xTicks
                    ? [xTicks[0] ?? "auto", xTicks.at(-1) ?? "auto"]
                    : [(low: number) => Math.min(low, ...xs), (high: number) => Math.max(high, ...xs)]
                }
                ticks={xTicks}
                niceTicks={xTicks ? undefined : "snap125"}
                // A sized dot at the end of the range would spill past the axis by up to its radius.
                padding={largest > 0 ? { left: MAX_RADIUS, right: MAX_RADIUS } : undefined}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={TICK}
                tickFormatter={(value: number) => formatX(value)}
                height={48}
                label={{ value: xLabel, position: "insideBottom", className: AXIS_TITLE }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[yTicks[0] ?? "auto", yTicks.at(-1) ?? "auto"]}
                ticks={yTicks}
                padding={largest > 0 ? { top: MAX_RADIUS, bottom: MAX_RADIUS } : undefined}
                tickLine={false}
                axisLine={false}
                width="auto"
                tick={TICK}
                tickFormatter={(value: number) => formatY(value)}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                  className: AXIS_TITLE,
                }}
              />
              {quadrants ? (
                <>
                  <ReferenceLine x={quadrants.x} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <ReferenceLine y={quadrants.y} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <QuadrantNames quadrants={quadrants} />
                </>
              ) : (
                crossesZero && <ReferenceLine y={0} stroke="var(--border)" />
              )}
              <Tooltip cursor={false} isAnimationActive={false} content={<PointTooltip details={rows} />} />
              <Scatter
                data={painted}
                fill="var(--chart-1)"
                isAnimationActive={false}
                shape={
                  <Dot
                    selectedKey={selectedKey}
                    focusKey={onSelect ? focusKey : null}
                    describe={(p: T) => [p.name, ...rows(p).map(([label, value]) => `${label} ${value}`)].join(", ")}
                    onSelect={onSelect}
                    onKeyDown={onKeyDown}
                    radiusOf={radiusOf}
                    sized={largest > 0}
                  />
                }
              />
              <PointLabels points={drawn} limit={labels} radiusOf={radiusOf} quadrants={quadrants} />
            </ScatterChart>
          </ChartContainer>
        </div>
      </CardContent>
      {footer && <CardFooter className="flex-col items-start gap-2 text-sm">{footer}</CardFooter>}
    </Card>
  );
}

/** The hovered point's name, then its rows. Recharts passes the hovered point in as payload. */
function PointTooltip<T extends ScatterPoint>({
  active,
  payload,
  details,
}: {
  active?: boolean;
  payload?: readonly { payload?: T }[];
  details: (point: T) => readonly ScatterDetail[];
}) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="font-medium">{point.name}</span>
      {details(point).map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono font-medium text-foreground tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

interface DotProps<T extends ScatterPoint> {
  /** From Recharts: the dot's pixel position, its point, and the ids its touch handling finds the dot by. */
  cx?: number;
  cy?: number;
  payload?: T;
  index?: number;
  "data-recharts-item-id"?: string;
  selectedKey: string | null;
  /** The one dot Tab lands on, or null when the dots are not controls. */
  focusKey: string | null;
  describe: (point: T) => string;
  onSelect: ((point: T | null) => void) | undefined;
  onKeyDown: (event: KeyboardEvent, point: T) => void;
  radiusOf: (point: T) => number;
  /** Dots drawn by size are a tint inside a full edge, so overlaps show through. */
  sized: boolean;
}

/** One point's dot. A ring marks the selected one; with onSelect it is a button Tab and the arrow keys reach. */
function Dot<T extends ScatterPoint>({
  cx,
  cy,
  payload,
  index,
  "data-recharts-item-id": itemId,
  selectedKey,
  focusKey,
  describe,
  onSelect,
  onKeyDown,
  radiusOf,
  sized,
}: DotProps<T>) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const key = keyOf(payload);
  const isSelected = key === selectedKey;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radiusOf(payload) + (isSelected ? 2 : 0)}
      fill="var(--chart-1)"
      fillOpacity={sized ? SIZED_FILL : 1}
      stroke={isSelected ? "var(--foreground)" : sized ? "var(--chart-1)" : "var(--card)"}
      strokeWidth={isSelected ? 2 : EDGE}
      data-slot="scatter-point"
      data-key={key}
      data-selected={isSelected || undefined}
      // Recharts' touch handling finds the dot under a finger by these two.
      data-recharts-item-id={itemId}
      data-recharts-item-index={index}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? (key === focusKey ? 0 : -1) : undefined}
      aria-label={describe(payload)}
      aria-pressed={onSelect ? isSelected : undefined}
      className={onSelect ? "cursor-pointer outline-none focus-visible:stroke-ring focus-visible:stroke-2" : undefined}
      onKeyDown={(event) => onKeyDown(event, payload)}
      onClick={(event) => {
        if (!onSelect) return;
        event.stopPropagation();
        onSelect(isSelected ? null : payload);
      }}
    />
  );
}

/** A name's width in the labels' type, measured on a canvas once per font and name. */
const widths = new Map<string, number>();
let canvas: CanvasRenderingContext2D | null | undefined;

/** The labels' type as the page sets it: text-xs is three quarters of the root size, which a reader may enlarge. */
function labelType(): LabelType {
  if (typeof document === "undefined") return { size: 12, measure: (text) => text.length * 7 };
  const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75;
  const font = `500 ${size}px ${getComputedStyle(document.body).fontFamily}`;
  canvas ??= document.createElement("canvas").getContext("2d");
  const measure = (text: string) => {
    const id = `${font}\n${text}`;
    let width = widths.get(id);
    if (width === undefined && canvas) {
      canvas.font = font;
      width = canvas.measureText(text).width;
      widths.set(id, width);
    }
    return width ?? text.length * size * 0.6;
  };
  return { size, measure };
}

/** The leading points' names, placed from the axes' scales once the chart has laid them out. */
type QuadrantLabels = ScatterQuadrants["labels"];

/** Words broken into lines no wider than `width`; a word wider than that keeps a line of its own. */
function wrap(text: string, width: number, measure: LabelType["measure"]): string[] {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`) <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/**
 * Each corner's name in the plot's corner, wrapped to its own quadrant's width so two names on one edge never meet:
 * where its lines are drawn, and the box they take.
 */
function corners(plot: Box, names: QuadrantLabels, split: { x: number; y: number } | null, type: LabelType) {
  if (!names || !split) return [];
  const line = (type.size * 4) / 3;
  const inset = 6;
  const spots = [
    [names.topLeft, "left", "top"],
    [names.topRight, "right", "top"],
    [names.bottomLeft, "left", "bottom"],
    [names.bottomRight, "right", "bottom"],
  ] as const;
  return spots.flatMap(([text, side, edge]) => {
    if (!text) return [];
    const room = (side === "left" ? split.x - plot.x : plot.x + plot.width - split.x) - inset * 2;
    const lines = wrap(text, Math.max(room, 0), type.measure);
    const width = Math.max(...lines.map(type.measure));
    const height = lines.length * line;
    const x = side === "left" ? plot.x + inset : plot.x + plot.width - inset - width;
    const top = edge === "top" ? plot.y + inset : plot.y + plot.height - inset - height;
    return [{ key: `${side}-${edge}`, lines, x, y: top + type.size, line, box: { x, y: top, width, height } }];
  });
}

/** Where the quadrants' split lines cross, in pixels, once the axes are laid out. */
function useSplit(quadrants: ScatterQuadrants | undefined) {
  const x = useXAxisScale();
  const y = useYAxisScale();
  return quadrants && x && y ? { x: Number(x(quadrants.x)), y: Number(y(quadrants.y)) } : null;
}

/** The quadrants' names, muted, in the plot's corners. */
function QuadrantNames({ quadrants }: { quadrants: ScatterQuadrants }) {
  const plot = usePlotArea();
  const split = useSplit(quadrants);
  if (!plot) return null;
  // Above the dots, as the points' names are: a big dot in a corner would otherwise hide the corner's name.
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.label}>
      <g data-slot="scatter-quadrant-names" pointerEvents="none">
        {corners(plot, quadrants.labels, split, labelType()).map(({ key, lines, x, y, line }) => (
          <text
            key={key}
            x={x}
            y={y}
            className="fill-muted-foreground stroke-card text-xs font-medium"
            style={{ paintOrder: "stroke" }}
            strokeWidth={3}
            strokeLinejoin="round"
          >
            {lines.map((text, index) => (
              <tspan key={text} x={x} dy={index === 0 ? 0 : line}>
                {text}
              </tspan>
            ))}
          </text>
        ))}
      </g>
    </ZIndexLayer>
  );
}

function PointLabels({
  points,
  limit,
  radiusOf,
  quadrants,
}: {
  points: readonly ScatterPoint[];
  limit: number;
  radiusOf: (point: ScatterPoint) => number;
  quadrants: ScatterQuadrants | undefined;
}) {
  const x = useXAxisScale();
  const y = useYAxisScale();
  const plot = usePlotArea();
  const split = useSplit(quadrants);
  if (!x || !y || !plot || limit <= 0) return null;
  const type = labelType();
  const candidates = points.map((p) => ({
    key: keyOf(p),
    text: p.name,
    cx: Number(x(p.x)),
    cy: Number(y(p.y)),
    r: radiusOf(p) + EDGE,
  }));
  // Recharts draws dots in a layer of their own; the names go in the label layer above it.
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.label}>
      <g data-slot="scatter-labels" pointerEvents="none">
        {placeLabels(
          candidates,
          plot,
          limit,
          type,
          corners(plot, quadrants?.labels, split, type).map(({ box }) => box),
        ).map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={label.y}
            // A halo in the card's colour keeps a name readable across the grid and the dots it passes.
            className="fill-foreground stroke-card text-xs font-medium"
            style={{ paintOrder: "stroke" }}
            strokeWidth={3}
            strokeLinejoin="round"
          >
            {label.text}
          </text>
        ))}
      </g>
    </ZIndexLayer>
  );
}
