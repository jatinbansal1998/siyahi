import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  DefaultZIndexes,
  Rectangle,
  ReferenceLine,
  usePlotArea,
  type BarShapeProps,
} from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { BlockState } from "@siyahi/ui/components/siyahi/block-state";
import { ChartFrame, barFill } from "@siyahi/ui/lib/chart-frame";
import { fixed, signed } from "@siyahi/ui/lib/format";
import type { SiyahiLocale } from "@siyahi/ui/lib/locale";
import type { ChartColor, SeriesChartProps } from "@siyahi/ui/lib/chart-series";
import { decimalsOf, linearAxis } from "@siyahi/ui/lib/ticks";

/**
 * One bar of a waterfall. A change moves the running total by its value. A total draws the running total from the
 * axis' foot, zero unless the page cuts the axis; give it a value to set the total instead, as an opening balance does. Labels may repeat, such as "Balance" at
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

/** Walks the steps in order, keeping the running total. A total's bar stands on `foot`, the axis' end nearest zero. */
export function waterfallBars(steps: readonly WaterfallStep[], foot = 0): WaterfallBar[] {
  let level = 0;
  return steps.map((step, index) => {
    const before = level;
    const key = String(index);
    if (step.kind === "total") {
      level = step.value ?? level;
      const continues = level === before;
      return {
        key,
        label: step.label,
        kind: "total",
        change: level - before,
        level,
        span: span(foot, level),
        continues,
      };
    }
    level += step.value;
    const kind = step.value < 0 ? "fall" : "rise";
    return { key, label: step.label, kind, change: step.value, level, span: span(before, level), continues: true };
  });
}

/**
 * The value axis from `yFrom` rather than zero: the round ticks that cover it and every level drawn, and the end
 * nearest zero, which totals stand on, when the axis does not reach zero. A waterfall that starts with a change starts
 * from zero, so its axis reaches zero and is not cut.
 */
export function cutAxis(
  steps: readonly WaterfallStep[],
  yFrom: number,
  levels: readonly number[] = [],
): { domain: [number, number]; ticks: number[]; foot: number } | undefined {
  const drawn = waterfallBars(steps).flatMap((bar) => (bar.kind === "total" ? [bar.level] : bar.span));
  const axis = linearAxis([yFrom, ...drawn, ...levels]);
  if (!axis) return undefined;
  const [low, high] = axis.domain;
  if (low <= 0 && high >= 0) return undefined;
  return { ...axis, foot: low > 0 ? low : high };
}

/** The figures a page that gives no valueFormatter reads: in the steps' own decimals, up to two, 24,312.45 or 4,820. */
export function stepFigures(steps: readonly WaterfallStep[], locale: SiyahiLocale): (value: number) => string {
  const digits = Math.min(2, Math.max(0, ...steps.map(({ value }) => decimalsOf(value ?? 0))));
  return (value) => fixed(value, locale, digits);
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
  /**
   * Where the value axis starts in place of zero, for levels far from it: a portfolio that went from ₹1.00Cr to ₹1.24Cr
   * starts at ₹90L, and its changes fill the plot. The axis ends on the round tick at or under it. Totals then draw
   * as a line at their level rather than a bar, whose length would misstate them, and the axis is marked as cut.
   */
  yFrom?: number | undefined;
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

// Every bar is a tint inside a full-colour edge, as every chart's bars are; a total stands out by its colour.
const fill = (kind: WaterfallBar["kind"]) => barFill(COLOR[kind]);

function Legend({ labels, cut }: { labels: typeof LABELS; cut: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      {(["rise", "fall", "total"] as const).map((kind) => (
        <div key={kind} className="flex items-center gap-1.5">
          {cut && kind === "total" ? (
            <div className="h-0.5 w-3 shrink-0" style={{ backgroundColor: COLOR.total }} />
          ) : (
            <div
              className="size-2 shrink-0 rounded-xs border"
              style={{ backgroundColor: fill(kind), borderColor: COLOR[kind] }}
            />
          )}
          {labels[kind]}
        </div>
      ))}
    </div>
  );
}

/**
 * A bar, or on a cut axis a total's level: a 2px line across the bar's width at the end away from the axis' foot.
 * `above` says the foot is the axis' low end, as it is for levels over zero.
 */
function levelShape(horizontal: boolean, cut: { above: boolean } | undefined) {
  return (props: BarShapeProps) => {
    const bar = props.payload as WaterfallBar;
    if (!cut || bar.kind !== "total") return <Rectangle {...props} />;
    const { x, y, width, height } = props;
    const line = { "data-slot": "waterfall-level", stroke: COLOR.total, strokeWidth: 2 };
    if (horizontal) {
      const level = cut.above ? x + width : x;
      return <line {...line} x1={level} x2={level} y1={y} y2={y + height} />;
    }
    const level = cut.above ? y : y + height;
    return <line {...line} x1={x} x2={x + width} y1={level} y2={level} />;
  };
}

/**
 * Two slashes across the value axis' foot, where zero would be, as a cut axis is marked on paper. The gap between
 * them breaks the gridline.
 */
function AxisCut({ horizontal, above, label }: { horizontal: boolean; above: boolean; label: string }) {
  const plot = usePlotArea();
  if (!plot) return null;
  // Drawn across a level gridline at the origin, then turned onto the value axis' foot.
  const [x, y, turn] = horizontal
    ? [above ? plot.x : plot.x + plot.width, plot.y + plot.height - 8, 90]
    : [plot.x + 8, above ? plot.y + plot.height : plot.y, 0];
  return (
    <g data-slot="waterfall-axis-cut" transform={`translate(${x} ${y}) rotate(${turn})`} role="img" aria-label={label}>
      <path d="M -5 5 L -1 -5 L 3 -5 L -1 5 Z" fill="var(--card)" />
      <path d="M -5 5 L -1 -5 M -1 5 L 3 -5" stroke="var(--muted-foreground)" fill="none" />
    </g>
  );
}

/**
 * A running total bridged step by step: where it starts, each change that moved it, and where it ends, such as a
 * year's profit built up month by month. Rises and falls float at the level the one before left; totals stand on zero.
 */
export function WaterfallChartCard({
  steps,
  horizontal = false,
  labels = LABELS,
  yFrom,
  ...props
}: WaterfallChartCardProps) {
  const locale = useLocale();
  const levels = (props.referenceLines ?? []).flatMap(({ y }) => (y === undefined ? [] : [y]));
  const cut = yFrom === undefined ? undefined : cutAxis(steps, yFrom, levels);
  const bars = useMemo(() => waterfallBars(steps, cut?.foot), [steps, cut?.foot]);
  const format = props.valueFormatter ?? stepFigures(steps, locale);
  const names = new Map(bars.map((bar) => [bar.key, bar.label]));
  const unknown = unknownStep(steps);
  return (
    <ChartFrame
      chart={BarChart}
      {...props}
      placeholder={
        props.placeholder ??
        (unknown && (
          <BlockState
            title={`${unknown.label} has no figure`}
            description="The running total after it is unknown, so the chart is not drawn."
          />
        ))
      }
      horizontal={horizontal}
      yDomain={cut?.domain}
      yTicks={cut?.ticks}
      data={bars}
      xKey="key"
      xFormatter={(key) => names.get(key) ?? key}
      series={[{ key: "level", label: labels.total, color: COLOR.total }]}
      legend={<Legend labels={labels} cut={cut !== undefined} />}
      tooltipRow={(_value, _name, item) => {
        const bar = item.payload as WaterfallBar;
        const rows: [string, string][] =
          bar.kind === "total"
            ? [[labels.total, format(bar.level)]]
            : [
                [bar.kind === "rise" ? labels.rise : labels.fall, signed(bar.change, format)],
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
      {/* Each level runs on from one bar to the next, behind both, so it shows only in the gap between them. Recharts
      draws reference lines over bars unless told otherwise, which put the dashes over a total's level line. */}
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
            zIndex={DefaultZIndexes.bar - 1}
            data-slot="waterfall-connector"
          />
        );
      })}
      <Bar
        dataKey="span"
        name={labels.total}
        maxBarSize={horizontal ? 24 : 48}
        isAnimationActive={false}
        shape={levelShape(horizontal, cut && { above: cut.foot > 0 })}
      >
        {bars.map((bar) => (
          <Cell key={bar.key} fill={fill(bar.kind)} stroke={COLOR[bar.kind]} strokeWidth={1} />
        ))}
      </Bar>
      {cut && (
        <AxisCut
          horizontal={horizontal}
          above={cut.foot > 0}
          label={`The value axis starts at ${format(cut.foot)}, not zero`}
        />
      )}
    </ChartFrame>
  );
}
