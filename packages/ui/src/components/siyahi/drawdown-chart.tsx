import { useMemo } from "react";
import { Area, AreaChart } from "recharts";
import { ChartFrame } from "@siyahi/ui/lib/chart-frame";
import type { NumericKey, SeriesChartProps } from "@siyahi/ui/lib/chart-series";
import { useFormat } from "@siyahi/ui/lib/format";
import { linearTicks } from "@siyahi/ui/lib/ticks";

/** One point as drawn: how far the level sits below the highest it had reached, and that high. */
export interface DrawdownPoint<X> {
  x: X;
  /** The fall from the peak as a fraction, 0 at a new high and −0.25 a quarter below it; null when the level is unknown. */
  drawdown: number | null;
  /** The highest level so far. */
  peak: number;
  level: number | null;
}

/**
 * Walks the levels in order, keeping the highest so far. A level that is not a finite number has no drawdown and
 * leaves the peak as it was; the first level is the first peak.
 */
export function drawdowns<X>(levels: readonly { x: X; level: number | null }[]): DrawdownPoint<X>[] {
  let peak = Number.NEGATIVE_INFINITY;
  return levels.map(({ x, level }) => {
    if (level === null || !Number.isFinite(level)) {
      return { x, level: null, drawdown: null, peak };
    }
    peak = Math.max(peak, level);
    return { x, level, peak, drawdown: peak > 0 ? level / peak - 1 : 0 };
  });
}

export interface DrawdownChartCardProps<T extends object, K extends keyof T> extends Pick<
  SeriesChartProps<T, K>,
  | "title"
  | "description"
  | "action"
  | "data"
  | "xKey"
  | "height"
  | "xFormatter"
  | "xTooltipFormatter"
  | "xTicks"
  | "placeholder"
  | "footer"
> {
  /** The field holding the level, such as the day's cash balance or a fund's value. */
  levelKey: NumericKey<T>;
  /** Writes the level and the peak in the tooltip. Defaults to useFormat().money. */
  levelFormatter?: (value: number) => string;
  /** Names the fall in the legend and tooltip. */
  label?: string;
}

/**
 * How far a level sits below the highest it had reached, over time: a fund's or a cash balance's fall from its
 * peak. The area hangs from zero in the loss colour, so the deepest and longest falls read at once, and a dashed
 * line marks the deepest one. Levels must be above zero: a fall is a share of the peak.
 */
export function DrawdownChartCard<T extends object, K extends keyof T>({
  data,
  xKey,
  levelKey,
  levelFormatter,
  label = "Below peak",
  xFormatter = String,
  xTooltipFormatter,
  xTicks,
  ...props
}: DrawdownChartCardProps<T, K>) {
  const f = useFormat();
  const formatLevel = levelFormatter ?? ((value: number) => f.money(value));
  const points = useMemo(
    () => drawdowns(data.map((row) => ({ x: row[xKey], level: row[levelKey] as number | null }))),
    [data, xKey, levelKey],
  );
  const fall = (value: number) => (value < 0 ? `−${f.pct(-value)}` : f.pct(0));
  const deepest = Math.min(0, ...points.flatMap(({ drawdown }) => drawdown ?? []));
  // Round ticks from zero down past the deepest fall: −5%, −10%, never −10.9%.
  const ticks = linearTicks(Math.min(deepest, -0.01), 0);
  return (
    <ChartFrame<DrawdownPoint<T[K]>, "x">
      chart={AreaChart}
      {...props}
      data={points}
      xKey="x"
      xFormatter={(x) => xFormatter(x)}
      xTooltipFormatter={(x) => (xTooltipFormatter ?? xFormatter)(x)}
      xTicks={xTicks}
      series={[{ key: "drawdown", label, color: "var(--negative)" }]}
      yDomain={[Math.min(deepest, ticks[0] ?? deepest), 0]}
      yTicks={ticks}
      yTickFormatter={(value) => fall(value)}
      referenceLines={
        deepest < 0 ? [{ y: deepest, label: `Deepest ${fall(deepest)}`, labelPosition: "insideBottomRight" }] : []
      }
      tooltipRow={(_value, _name, item) => {
        const point = item.payload as DrawdownPoint<T[K]>;
        const rows: [string, string][] =
          point.drawdown === null
            ? [[label, "—"]]
            : [
                [label, fall(point.drawdown)],
                ["Level", formatLevel(point.level ?? 0)],
                ["Peak so far", formatLevel(point.peak)],
              ];
        return rows.map(([name, figure]) => (
          <div key={name} className="flex w-full items-center gap-2">
            <span className="text-muted-foreground">{name}</span>
            <span className="ml-auto font-mono font-medium text-foreground tabular-nums">{figure}</span>
          </div>
        ));
      }}
    >
      {/* The fall hangs from zero: a tint of the loss colour under a full-strength line. */}
      <Area
        dataKey="drawdown"
        name={label}
        type="linear"
        baseValue={0}
        stroke="var(--negative)"
        strokeWidth={2}
        fill="color-mix(in oklab, var(--negative) 25%, var(--card))"
        fillOpacity={1}
        dot={false}
        connectNulls={false}
      />
    </ChartFrame>
  );
}
