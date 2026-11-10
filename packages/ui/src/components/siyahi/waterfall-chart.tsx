import { useMemo } from "react";
import { Bar, BarChart, Cell, ReferenceLine } from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { ChartFrame, barFill } from "@siyahi/ui/lib/chart-frame";
import type { ChartColor, SeriesChartProps } from "@siyahi/ui/lib/chart-series";

/**
 * One bar of a waterfall. A change moves the running total by its value. A total draws the running total from zero;
 * give it a value to set the total instead, as an opening balance does. Labels may repeat, such as "Balance" at
 * both ends: each bar is placed by its position.
 */
export type WaterfallStep =
  | { kind: "change"; label: string; value: number }
  | { kind: "total"; label: string; value?: number | undefined };

/** A step as drawn: the running total after it, and the span its bar covers. */
export interface WaterfallBar {
  /** The step's position, as text: the category the bar is placed by. */
  key: string;
  label: string;
  kind: "rise" | "fall" | "total";
  /** How far the step moved the running total. */
  change: number;
  /** The running total after the step. */
  level: number;
  /** The bar's low and high ends, low first whichever way the step moved: Recharts reads a range that way. */
  span: [number, number];
  /** The bar picks up at the level the one before left, so a dashed line joins them. */
  continues: boolean;
}

const span = (a: number, b: number): [number, number] => [Math.min(a, b), Math.max(a, b)];

/** Walks the steps in order, keeping the running total. */
export function waterfallBars(steps: readonly WaterfallStep[]): WaterfallBar[] {
  let level = 0;
  return steps.map((step, index) => {
    const before = level;
    const key = String(index);
    if (step.kind === "total") {
      level = step.value ?? level;
      const continues = level === before;
      return { key, label: step.label, kind: "total", change: level - before, level, span: span(0, level), continues };
    }
    level += step.value;
    const kind = step.value < 0 ? "fall" : "rise";
    return { key, label: step.label, kind, change: step.value, level, span: span(before, level), continues: true };
  });
}

/**
 * The first step whose figure is not a number. Every bar after it stands on the running total, so a missing change
 * cannot be skipped without drawing wrong balances; the card says which step is missing instead.
 */
const unknownStep = (steps: readonly WaterfallStep[]) =>
  steps.find((step) => step.value !== undefined && !Number.isFinite(step.value));

export interface WaterfallChartCardProps extends Pick<
  SeriesChartProps<WaterfallBar, "key">,
  | "title"
  | "description"
  | "action"
  | "height"
  | "valueFormatter"
  | "yTickFormatter"
  | "yLabel"
  | "referenceLines"
  | "placeholder"
  | "footer"
> {
  /** The bars in order: usually a total to start from, the changes, and a total to end on. */
  steps: readonly WaterfallStep[];
  /** Bars run sideways with the labels down the left, for long names such as product categories. */
  horizontal?: boolean | undefined;
  /** What the legend calls each kind of bar. */
  labels?: { rise: string; fall: string; total: string } | undefined;
}

const COLOR: Record<WaterfallBar["kind"], ChartColor> = {
  rise: "var(--positive)",
  fall: "var(--negative)",
  total: "var(--chart-1)",
};
const LABELS = { rise: "Increase", fall: "Decrease", total: "Total" };
const MINUS = "−";

// Every bar is a tint inside a full-colour edge, as every chart's bars are; a total stands out by its colour.
const fill = (kind: WaterfallBar["kind"]) => barFill(COLOR[kind]);

function Legend({ labels }: { labels: typeof LABELS }) {
  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      {(["rise", "fall", "total"] as const).map((kind) => (
        <div key={kind} className="flex items-center gap-1.5">
          <div
            className="size-2 shrink-0 rounded-xs border"
            style={{ backgroundColor: fill(kind), borderColor: COLOR[kind] }}
          />
          {labels[kind]}
        </div>
      ))}
    </div>
  );
}

/**
 * A running total bridged step by step: where it starts, each change that moved it, and where it ends, such as a
 * year's profit built up month by month. Rises and falls float at the level the one before left; totals stand on zero.
 */
export function WaterfallChartCard({ steps, horizontal = false, labels = LABELS, ...props }: WaterfallChartCardProps) {
  const { numberLocale } = useLocale();
  const bars = useMemo(() => waterfallBars(steps), [steps]);
  const format = props.valueFormatter ?? new Intl.NumberFormat(numberLocale).format;
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? MINUS : ""}${format(Math.abs(value))}`;
  const names = new Map(bars.map((bar) => [bar.key, bar.label]));
  const unknown = unknownStep(steps);
  return (
    <ChartFrame
      chart={BarChart}
      {...props}
      placeholder={
        props.placeholder ??
        (unknown && (
          <p className="text-sm text-muted-foreground">
            {unknown.label} has no figure, so the running total after it is unknown.
          </p>
        ))
      }
      horizontal={horizontal}
      data={bars}
      xKey="key"
      xFormatter={(key) => names.get(key) ?? key}
      series={[{ key: "level", label: labels.total, color: COLOR.total }]}
      legend={<Legend labels={labels} />}
      tooltipRow={(_value, _name, item) => {
        const bar = item.payload as WaterfallBar;
        const rows: [string, string][] =
          bar.kind === "total"
            ? [[labels.total, format(bar.level)]]
            : [
                [bar.kind === "rise" ? labels.rise : labels.fall, signed(bar.change)],
                ["Running total", format(bar.level)],
              ];
        return rows.map(([name, figure]) => (
          <div key={name} className="flex w-full items-center gap-2">
            <span className="text-muted-foreground">{name}</span>
            <span className="ml-auto font-mono font-medium text-foreground tabular-nums">{figure}</span>
          </div>
        ));
      }}
    >
      {/* Each level runs on from one bar to the next, behind both, so it shows only in the gap between them. */}
      {bars.slice(0, -1).map((bar, i) => {
        const next = bars[i + 1]!;
        if (!next.continues) return null;
        const at = (key: string): { x: number | string; y: number | string } =>
          horizontal ? { x: bar.level, y: key } : { x: key, y: bar.level };
        return (
          <ReferenceLine
            key={bar.key}
            segment={[at(bar.key), at(next.key)]}
            stroke="var(--muted-foreground)"
            strokeDasharray="2 2"
            data-slot="waterfall-connector"
          />
        );
      })}
      <Bar dataKey="span" name={labels.total} maxBarSize={horizontal ? 24 : 48} isAnimationActive={false}>
        {bars.map((bar) => (
          <Cell key={bar.key} fill={fill(bar.kind)} stroke={COLOR[bar.kind]} strokeWidth={1} />
        ))}
      </Bar>
    </ChartFrame>
  );
}
