import { useEffect, useRef, useState } from "react";
import {
  createSeriesMarkers,
  LineSeries,
  LineStyle,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type { ChartColor } from "@siyahi/ui/lib/chart-series";
import { createThemedChart } from "@siyahi/ui/lib/lightweight-chart";

export interface TimeSeriesChartSeries {
  label: string;
  color: ChartColor;
  data: LineData<Time>[];
}

export interface TimeSeriesChartPane {
  /** Pixels, legend included. */
  height: number;
  /** At least one; the first carries the pane's levels, and the first pane's first carries the events. */
  series: TimeSeriesChartSeries[];
  /** Dashed lines across the pane, such as zero or 50%. */
  levels?: { value: number; label?: string | undefined }[] | undefined;
  /** Writes the pane's axis ticks and legend values. Defaults to the library's two decimals. */
  format?: ((value: number) => string) | undefined;
}

export interface TimeSeriesChartProps {
  /** Top to bottom. Keep the array stable (useMemo): a new one redraws the chart. */
  panes: TimeSeriesChartPane[];
  /** Notes over the first pane's first line, such as where a month starts. Each time must be one of its points. */
  events?: { time: Time; label: string }[] | undefined;
  /** TradingView's licence asks for a credit on the page; turn it off on the second chart. */
  credit?: boolean | undefined;
}

// The time axis is held at a fixed height and the library divides panes by 1px, so each legend's top is known.
const LEGEND_ROW = 16;
const LEGEND_GAP = 4;
const TIME_AXIS = 28;
const DIVIDER = 1;

/**
 * Daily series stacked in panes on one time axis, TradingView style: panning, zoom and the crosshair move every pane
 * together, and each pane's legend gives every line's value at the crosshair's date, or its latest.
 */
export function TimeSeriesChart({ panes, events, credit = true }: TimeSeriesChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<string[][]>([]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return createThemedChart(element, credit, (chart) => {
      chart.applyOptions({ timeScale: { minimumHeight: TIME_AXIS } });
      const drawn = panes.map(({ height, series, levels = [], format }, index) => {
        const lines = series.map(({ data }) => {
          const line = chart.addSeries(
            LineSeries,
            {
              lineWidth: 2,
              priceLineVisible: false,
              ...(format && { priceFormat: { type: "custom", formatter: format } }),
            },
            index,
          );
          line.setData(data);
          return line;
        });
        const pane = chart.panes()[index];
        pane.setStretchFactor(height);
        // One legend line per series, as TradingView stacks them, so a phone never wraps one over the lines.
        const legend = 2 * LEGEND_GAP + series.length * LEGEND_ROW;
        pane.priceScale("right").applyOptions({ scaleMargins: { top: legend / height, bottom: 0.1 } });
        const rules = levels.map(({ value, label = "" }) =>
          lines[0].createPriceLine({ price: value, title: label, lineStyle: LineStyle.Dashed, lineWidth: 1 }),
        );
        return { lines, rules };
      });
      const markers = events && createSeriesMarkers(drawn[0].lines[0]);
      // Off the plot the crosshair has no time, and each legend falls back to its lines' latest points.
      const read = ({ time, seriesData }: Partial<MouseEventParams> = {}) =>
        drawn.map(({ lines }, p) =>
          lines.map((line, s) => {
            const point = time === undefined ? panes[p].series[s].data.at(-1) : seriesData?.get(line);
            const value = point && "value" in point ? point.value : undefined;
            return typeof value === "number" ? line.priceFormatter().format(value) : "—";
          }),
        );
      setValues(read());
      chart.subscribeCrosshairMove((param) => setValues(read(param)));
      chart.timeScale().fitContent();
      return (color) => {
        const muted = color("--muted-foreground");
        drawn.forEach(({ lines, rules }, p) => {
          lines.forEach((line, s) => line.applyOptions({ color: color(panes[p].series[s].color) }));
          rules.forEach((rule) => rule.applyOptions({ color: muted }));
        });
        markers?.setMarkers(
          (events ?? []).map(({ time, label }) => ({
            time,
            text: label,
            position: "aboveBar",
            shape: "arrowDown",
            color: muted,
          })),
        );
      };
    });
  }, [panes, events, credit]);
  const tops = panes.map((_, p) => panes.slice(0, p).reduce((top, pane) => top + pane.height + DIVIDER, 0));
  const height = panes.reduce((sum, pane) => sum + pane.height + DIVIDER, -DIVIDER) + TIME_AXIS;
  return (
    <div data-slot="time-series-chart" className="relative w-full font-mono text-xs" style={{ height }}>
      <div ref={ref} className="absolute inset-0" />
      {panes.map((pane, p) => (
        <ul
          key={pane.series.map(({ label }) => label).join()}
          data-slot="time-series-chart-legend"
          className="pointer-events-none absolute left-1 z-10"
          style={{ top: tops[p] + LEGEND_GAP }}
        >
          {pane.series.map(({ label, color }, s) => (
            <li key={label} className="flex h-4 items-center gap-1.5">
              <span className="size-2 shrink-0" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{label}</span>
              <span className="tabular-nums">{values[p]?.[s]}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
