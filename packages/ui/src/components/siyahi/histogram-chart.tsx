import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, useChartWidth, usePlotArea, useXAxisScale } from "recharts";
import { ChartFrame, barFill, haloLine } from "@siyahi/ui/lib/chart-frame";
import type { SeriesChartProps } from "@siyahi/ui/lib/chart-series";
import { textWidth } from "@siyahi/ui/lib/fit-text";
import { useFormat } from "@siyahi/ui/lib/format";
import { decimalsOf, linearTicks } from "@siyahi/ui/lib/ticks";

/** One bucket: the values from `from` up to, not including, `to`; the last bucket takes its upper edge too. */
export interface HistogramBin {
  from: number;
  to: number;
  /** Halfway between the edges, where the bucket's bar is centred on the value axis. */
  middle: number;
  count: number;
}

const bucket = (from: number, to: number, count = 0): HistogramBin => ({ from, to, middle: (from + to) / 2, count });

/**
 * Buckets of one round width (1, 2, 2.5 or 5 × 10ⁿ) covering the values, about `target` of them. Values that are not
 * finite numbers are left out. The buckets also reach to cover `reach`, such as the marks' values, without counting
 * them.
 */
export function histogram(values: readonly number[], target = 12, reach: readonly number[] = []): HistogramBin[] {
  const known = values.filter(Number.isFinite);
  if (known.length === 0) return [];
  // A loop, not Math.min(...known): a spread of 200,000 timings overflows the call stack.
  let low = known[0]!;
  let high = low;
  for (const value of [...known, ...reach.filter(Number.isFinite)]) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const edges = linearTicks(low, high, target + 1);
  if (edges.length < 2) return [bucket(low, high, known.length)];
  const bins = edges.slice(0, -1).map((from, i) => bucket(from, edges[i + 1]!));
  for (const value of known) bins[bucketOf(bins, value)]!.count += 1;
  return bins;
}

/**
 * The bucket a value falls in, read against the buckets' own edges: dividing by the width instead put 0.3 in the
 * 0.2–0.3 bucket, as 0.3 / 0.1 is 2.9999999999999996. A value past the last edge belongs to the last bucket.
 */
export function bucketOf(bins: readonly HistogramBin[], value: number): number {
  const index = bins.findIndex((bin) => value < bin.to);
  return index === -1 ? bins.length - 1 : index;
}

/** The value below which `share` of the values fall, interpolating between the two nearest, as spreadsheets do. */
export function percentile(values: readonly number[], share: number): number | null {
  const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  if (sorted.length === 0) return null;
  const at = (sorted.length - 1) * share;
  const low = Math.floor(at);
  return sorted[low]! + (sorted[Math.ceil(at)]! - sorted[low]!) * (at - low);
}

const PERCENTILES = { median: 0.5, p90: 0.9, p95: 0.95, p99: 0.99 } as const;
export type HistogramPercentile = keyof typeof PERCENTILES;

/** A percentile of the values, or a value the page names, such as `{ value: 0, label: "zero" }`. */
export type HistogramMark = HistogramPercentile | { value: number; label: string };

/** A mark's line on the plot: where it is, and its name beside it. */
export interface PlacedMark {
  x: number;
  label: string;
  /** The name runs right of the line from its top, or left of it. */
  side: "left" | "right";
  /** Which line of names from the plot's top: 0 for the first, then one lower per name it had to clear. */
  row: number;
}

const MARK_GAP = 4;

/**
 * Where each mark's name goes. A name sits beside its own line, on the side where it stays on the plot and runs
 * across no other mark's line, so "zero" and "median" a few pixels apart point away from each other. A name that
 * would run into one already placed drops to the next line down. Marks are placed left to right.
 */
export function placeMarks(
  marks: readonly { x: number; label: string }[],
  plot: { x: number; width: number },
): PlacedMark[] {
  const ordered = marks.filter(({ x }) => Number.isFinite(x)).toSorted((a, b) => a.x - b.x);
  const rows: [number, number][][] = [];
  return ordered.map((mark) => {
    const width = textWidth(mark.label);
    const span = (side: PlacedMark["side"]): [number, number] =>
      side === "right"
        ? [mark.x + MARK_GAP, mark.x + MARK_GAP + width]
        : [mark.x - MARK_GAP - width, mark.x - MARK_GAP];
    const onPlot = ([from, to]: [number, number]) => from >= plot.x && to <= plot.x + plot.width;
    const crosses = ([from, to]: [number, number]) =>
      ordered.some((other) => other !== mark && other.x >= Math.min(from, mark.x) && other.x <= Math.max(to, mark.x));
    const sides = (["right", "left"] as const).filter((side) => onPlot(span(side)));
    // A name too long for either side of its line still goes on the roomier one.
    if (sides.length === 0) sides.push(mark.x - plot.x > plot.x + plot.width - mark.x ? "left" : "right");
    sides.sort((a, b) => Number(crosses(span(a))) - Number(crosses(span(b))));
    for (let row = 0; ; row++) {
      const taken = (rows[row] ??= []);
      const side = sides.find((candidate) => {
        const [from, to] = span(candidate);
        return taken.every(([start, end]) => to + MARK_GAP < start || from > end + MARK_GAP);
      });
      if (side) {
        taken.push(span(side));
        return { x: mark.x, label: mark.label, side, row };
      }
    }
  });
}

const MARK_LABEL = { paintOrder: "stroke", strokeWidth: 3, strokeLinejoin: "round" } as const;

/** Each mark as a line at its value, over a card-coloured band so it stays traceable across the bars, with its name. */
function MarkLines({ marks }: { marks: readonly { value: number; label: string }[] }) {
  const xScale = useXAxisScale();
  const plot = usePlotArea();
  if (!xScale || !plot) return null;
  const at = marks.flatMap(({ value, label }) => {
    const x = xScale(value);
    return x === undefined ? [] : [{ x, label }];
  });
  return (
    <g data-slot="histogram-mark-lines">
      {placeMarks(at, plot).map(({ x, label, side, row }) => (
        <g key={`${label}:${x}`} data-slot="histogram-mark">
          {haloLine({ x1: x, x2: x, y1: plot.y, y2: plot.y + plot.height, stroke: "var(--foreground)" })}
          <text
            x={side === "right" ? x + MARK_GAP : x - MARK_GAP}
            y={plot.y + 12 + row * 14}
            textAnchor={side === "right" ? "start" : "end"}
            // A halo in the card's colour keeps the name readable over a bar or a line it crosses.
            className="fill-muted-foreground stroke-card text-xs"
            style={MARK_LABEL}
          >
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

/**
 * The bucket edges to name under the axis: every one that fits the plot's width, else every 2nd, 5th or 10th, at
 * round multiples of the bucket width, so 12 buckets of 100 ms read 0, 200, 400 on a phone and every edge on a laptop.
 * The chart frame gives each its label's width and 12px, and the value axis 64px, and scrolls sideways past `room`.
 */
export function edgeTicks(bins: readonly HistogramBin[], format: (value: number) => string, room: number): number[] {
  const edges = [...bins.map(({ from }) => from), ...bins.slice(-1).map(({ to }) => to)];
  const width = bins[0] ? bins[0].to - bins[0].from : 0;
  const widest = Math.max(0, ...edges.map((edge) => textWidth(format(edge))));
  for (const every of [1, 2, 4, 5, 10, 20, 50]) {
    const ticks = edges.filter((edge) => Math.round(edge / width) % every === 0);
    if ((widest + 12) * ticks.length + 64 <= room) return ticks;
  }
  return edges.slice(0, 1);
}

/**
 * Tells the card how wide its chart drew, which the edges under the axis are fitted to. Edges that fit leave the width
 * as it was; the plot's own width would not do, as the last edge's label sets the room right of it.
 */
function ChartWidth({ onChange }: { onChange: (width: number) => void }) {
  const width = useChartWidth();
  useEffect(() => {
    if (width) onChange(width);
  }, [width, onChange]);
  return null;
}

export interface HistogramChartCardProps extends Pick<
  SeriesChartProps<HistogramBin, "middle">,
  "title" | "description" | "action" | "height" | "xLabel" | "yLabel" | "placeholder" | "footer"
> {
  /** The raw values, one per item, such as each request's response time. */
  values: readonly number[];
  /** About how many buckets; the width is rounded, so the count varies a little. */
  bins?: number | undefined;
  /** Writes the bucket edges and the marks, such as (v) => `${v} ms`. Defaults to `fixed` in the edges' decimals. */
  valueFormatter?: ((value: number) => string) | undefined;
  /** The bucket edges under the axis, when they should be shorter than valueFormatter: 1,000 against 1,000 ms. */
  tickFormatter?: ((value: number) => string) | undefined;
  /** What is counted, in the legend and tooltip, such as "Requests". */
  countLabel?: string | undefined;
  /**
   * Lines at values on the axis, each named on the plot and written with its value under the chart: a percentile
   * of the values, or a value of the page's own with a name, such as `{ value: todaysMove, label: "today" }`.
   */
  marks?: readonly HistogramMark[] | undefined;
}

const NO_MARKS: readonly HistogramMark[] = [];

/**
 * How values spread: counts in buckets of one round width, such as response times by 50 ms, with the median, a high
 * percentile or a value of the page's own marked. The page gives the raw values; the card buckets them.
 */
export function HistogramChartCard({
  values,
  bins: target = 12,
  valueFormatter,
  tickFormatter,
  countLabel = "Count",
  marks = NO_MARKS,
  ...props
}: HistogramChartCardProps) {
  const { fixed } = useFormat();
  const marked = useMemo(
    () =>
      marks.flatMap((mark) => {
        if (typeof mark !== "string") return Number.isFinite(mark.value) ? [mark] : [];
        const value = percentile(values, PERCENTILES[mark]);
        return value === null ? [] : [{ value, label: mark }];
      }),
    [marks, values],
  );
  const bins = useMemo(
    () =>
      histogram(
        values,
        target,
        marked.map(({ value }) => value),
      ),
    [values, target, marked],
  );
  const first = bins[0];
  const last = bins.at(-1);
  // By default every figure keeps the bucket edges' decimals, so the edges of 0.25-wide buckets read 0.25, 0.50.
  const digits = first ? Math.max(decimalsOf(first.from), decimalsOf(first.to)) : 0;
  const format = valueFormatter ?? ((value: number) => fixed(value, digits));
  const byMiddle = new Map(bins.map((bin) => [bin.middle, bin]));
  const tickFormat = tickFormatter ?? format;
  // Until the chart has drawn, a phone's.
  const [chartWidth, setChartWidth] = useState(320);
  return (
    <ChartFrame
      chart={BarChart}
      {...props}
      data={bins}
      xKey="middle"
      // A value axis, so a mark sits at its value and each tick on the edge it names.
      xDomain={first && last && first.from < last.to ? [first.from, last.to] : undefined}
      xTicks={edgeTicks(bins, tickFormat, chartWidth)}
      xFormatter={tickFormat}
      xTooltipFormatter={(middle) => {
        const bin = byMiddle.get(middle);
        return bin ? `${format(bin.from)}–${format(bin.to)}` : format(middle);
      }}
      series={[{ key: "count", label: countLabel, color: "var(--chart-1)" }]}
      footer={
        marked.length > 0 || props.footer ? (
          <>
            {marked.length > 0 && (
              <p data-slot="histogram-marks" className="tabular-nums">
                {marked.map(({ label, value }) => `${label} ${format(value)}`).join(" · ")}
              </p>
            )}
            {props.footer}
          </>
        ) : undefined
      }
    >
      {/* The Bar's own fill is the full colour, which its legend chip shows; each bar draws as a tint in a Cell. */}
      <Bar dataKey="count" name={countLabel} fill="var(--chart-1)" isAnimationActive={false}>
        {bins.map((bin) => (
          <Cell key={bin.from} fill={barFill("var(--chart-1)")} stroke="var(--chart-1)" strokeWidth={1} />
        ))}
      </Bar>
      <MarkLines marks={marked} />
      <ChartWidth onChange={setChartWidth} />
    </ChartFrame>
  );
}
