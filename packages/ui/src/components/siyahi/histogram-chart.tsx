import { useMemo } from "react";
import { Bar, BarChart } from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { ChartFrame } from "@siyahi/ui/lib/chart-frame";
import type { ChartReferenceLine, SeriesChartProps } from "@siyahi/ui/lib/chart-series";
import { linearTicks } from "@siyahi/ui/lib/scatter";

/** One bucket: the values from `from` up to, not including, `to`; the last bucket takes its upper edge too. */
export interface HistogramBin {
  key: string;
  from: number;
  to: number;
  count: number;
}

/**
 * Buckets of one round width (1, 2, 2.5 or 5 × 10ⁿ) covering the values, about `target` of them. Values that are not
 * finite numbers are left out.
 */
export function histogram(values: readonly number[], target = 12): HistogramBin[] {
  const known = values.filter(Number.isFinite);
  if (known.length === 0) return [];
  const edges = linearTicks(Math.min(...known), Math.max(...known), target + 1);
  if (edges.length < 2) return [{ key: "0", from: known[0]!, to: known[0]!, count: known.length }];
  const step = edges[1]! - edges[0]!;
  const bins = edges.slice(0, -1).map((from, i) => ({ key: String(i), from, to: edges[i + 1]!, count: 0 }));
  for (const value of known) bins[Math.min(bins.length - 1, Math.floor((value - edges[0]!) / step))]!.count += 1;
  return bins;
}

/** The value below which `share` of the values fall, interpolating between the two nearest, as spreadsheets do. */
export function percentile(values: readonly number[], share: number): number | null {
  const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  if (sorted.length === 0) return null;
  const at = (sorted.length - 1) * share;
  const low = Math.floor(at);
  return sorted[low]! + (sorted[Math.ceil(at)]! - sorted[low]!) * (at - low);
}

const MARKS = { median: 0.5, p90: 0.9, p95: 0.95, p99: 0.99 } as const;
export type HistogramMark = keyof typeof MARKS;

export interface HistogramChartCardProps extends Pick<
  SeriesChartProps<HistogramBin, "key">,
  "title" | "description" | "action" | "height" | "xLabel" | "yLabel" | "placeholder" | "footer"
> {
  /** The raw values, one per item, such as each request's response time. */
  values: readonly number[];
  /** About how many buckets; the width is rounded, so the count varies a little. */
  bins?: number;
  /** Writes the bucket edges and the marks, such as (v) => `${v} ms`. Defaults to the locale's numbers. */
  valueFormatter?: (value: number) => string;
  /** The bucket edges under the axis, when they should be shorter than valueFormatter: 1,000 against 1,000 ms. */
  tickFormatter?: (value: number) => string;
  /** What is counted, in the legend and tooltip, such as "Requests". */
  countLabel?: string;
  /** Percentiles to mark with a line at their bucket; their exact values are written under the chart. */
  marks?: readonly HistogramMark[];
}

const NO_MARKS: readonly HistogramMark[] = [];

/**
 * How values spread: counts in buckets of one round width, such as response times by 50 ms, with the median or a
 * high percentile marked. The page gives the raw values; the card buckets them.
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
  const { numberLocale } = useLocale();
  const format = valueFormatter ?? new Intl.NumberFormat(numberLocale).format;
  const bins = useMemo(() => histogram(values, target), [values, target]);
  const range = (bin: HistogramBin) => `${format(bin.from)}–${format(bin.to)}`;
  const names = new Map(bins.map((bin) => [bin.key, bin]));
  const marked = marks.flatMap((mark) => {
    const value = percentile(values, MARKS[mark]);
    return value === null ? [] : [{ mark, value }];
  });
  const lines = marked.flatMap(({ mark, value }): ChartReferenceLine[] => {
    const bin = bins.find((b) => value < b.to) ?? bins.at(-1);
    if (!bin) return [];
    // A mark in the right half puts its name left of its line, so the name stays on the plot. The line carries only
    // the name, which fits beside it on a phone; the figure is written under the chart.
    const right = Number(bin.key) >= bins.length / 2;
    return [{ x: bin.key, label: mark, emphasis: "strong", labelPosition: right ? "insideTopRight" : "insideTopLeft" }];
  });
  return (
    <ChartFrame
      chart={BarChart}
      {...props}
      data={bins}
      xKey="key"
      xFormatter={(key) => {
        const bin = names.get(key);
        return bin ? (tickFormatter ?? format)(bin.from) : key;
      }}
      xTooltipFormatter={(key) => {
        const bin = names.get(key);
        return bin ? range(bin) : key;
      }}
      series={[{ key: "count", label: countLabel, color: "var(--chart-1)" }]}
      referenceLines={lines}
      footer={
        marked.length > 0 || props.footer ? (
          <>
            {marked.length > 0 && (
              <p data-slot="histogram-marks" className="tabular-nums">
                {marked.map(({ mark, value }) => `${mark} ${format(value)}`).join(" · ")}
              </p>
            )}
            {props.footer}
          </>
        ) : undefined
      }
    >
      <Bar dataKey="count" name={countLabel} fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
    </ChartFrame>
  );
}
