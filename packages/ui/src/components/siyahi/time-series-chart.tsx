import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AreaSeries,
  BaselineSeries,
  CandlestickSeries,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type BarPrice,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type SeriesDefinition,
  type SeriesMarker,
  type SeriesType,
  type Time,
} from "lightweight-charts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { fittedChartHeight, type ChartColor } from "@siyahi/ui/lib/chart-series";
import {
  createThemedChart,
  timeLabels,
  timeSeconds,
  type ThemeColor,
  type ThemedChart,
} from "@siyahi/ui/lib/lightweight-chart";
import type { SiyahiLocale } from "@siyahi/ui/lib/locale";
import type { AxisScale } from "@siyahi/ui/lib/ticks";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

/** A day as "2026-11-02", or a moment as seconds since 1970 (UTC). One kind per chart. */
export type TimeSeriesChartTime = string | number;

/** A null value is a gap in the line. */
export interface TimeSeriesChartPoint {
  time: TimeSeriesChartTime;
  value: number | null;
}

/** One bar of a price: where it opened, its highest and lowest, and where it closed. */
export interface TimeSeriesChartCandle {
  time: TimeSeriesChartTime;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TimeSeriesChartSeries = { label: string } & (
  | {
      /** A line by default; "area" fades a fill under it; "histogram" draws a bar per point from zero, as for volume. */
      type?: "line" | "area" | "histogram" | undefined;
      color: ChartColor;
      data: TimeSeriesChartPoint[];
    }
  | {
      /** A line in the gain colour above `base` and the loss colour below it, for a measure whose sign is a gain or a loss. */
      type: "baseline";
      /** Zero by default. */
      base?: number | undefined;
      data: TimeSeriesChartPoint[];
    }
  | {
      /** Open, high, low and close bars, a rise in the gain colour and a fall in the loss colour. */
      type: "candlestick";
      data: TimeSeriesChartCandle[];
    }
);

export interface TimeSeriesChartPane {
  /** Pixels, legend included. Left out, the first pane follows the chart's width (45% of it, 240 to 420) and a later one takes 120. */
  height?: number | undefined;
  /** At least one. The first pane's first series sets the dates the range buttons count from. */
  series: TimeSeriesChartSeries[];
  /** Dashed lines across the pane, such as zero or 50%. */
  levels?: { value: number; label?: string | undefined }[] | undefined;
  /** Writes the pane's axis ticks and legend values. Defaults to two decimals. */
  format?: ((value: number) => string) | undefined;
}

/** How much of the series shows, counted back from its last point. */
export type TimeSeriesChartRange = "1M" | "6M" | "1Y" | "All";

export interface TimeSeriesChartProps {
  /**
   * Top to bottom. New data in the same panes and series updates the chart in place and keeps the reader's zoom;
   * a pane or series added, removed or changed in type redraws it.
   */
  panes: TimeSeriesChartPane[];
  /** Notes over a pane's first series, such as where a month starts, each at its date or the last point before it. */
  events?:
    | {
        time: TimeSeriesChartTime;
        label: string;
        /** The pane's index; the first by default. */ pane?: number | undefined;
      }[]
    | undefined;
  /** Shows this much, up to the last point; everything by default. Left undefined later, the view stays where it is. */
  range?: TimeSeriesChartRange | undefined;
  /** The reader panned or zoomed by hand, so `range` no longer describes the view. */
  onZoom?: (() => void) | undefined;
  /** The first pane's value axis. Log needs every value in it above zero. */
  scale?: AxisScale | undefined;
  /** Shown in the chart's place, at its height, while the data loads or after it failed to. */
  placeholder?: ReactNode;
  /**
   * TradingView's logo at the plot's bottom left, a link to TradingView, which its licence asks the page for. Turn
   * it off on a second chart, or where the page links to TradingView itself, as the chart card's footer does.
   */
  credit?: boolean | undefined;
  /** Names the chart for a screen reader, which reads the legends: each line's name and latest value. */
  "aria-label"?: string | undefined;
}

// The time axis is held at a fixed height and the library divides panes by 1px, so each legend's top is known.
const LEGEND_ROW = 16;
const LEGEND_GAP = 4;
const TIME_AXIS = 28;
const DIVIDER = 1;
const LATER_PANE = 120;
const GESTURE_MS = 500;

const SERIES = {
  line: LineSeries,
  area: AreaSeries,
  histogram: HistogramSeries,
  baseline: BaselineSeries,
  candlestick: CandlestickSeries,
};
const RANGE_MONTHS = { "1M": 1, "6M": 6, "1Y": 12, All: undefined };

type Kind = keyof typeof SERIES;
type Events = TimeSeriesChartProps["events"];

const paneHeights = (panes: TimeSeriesChartPane[], width: number) =>
  panes.map(({ height }, p) => height ?? (p === 0 ? fittedChartHeight(width) : LATER_PANE));

/** The library marks its seconds with a type of its own; a page's are plain numbers. */
const chartTime = (time: TimeSeriesChartTime) => time as Time;

const HIDDEN = "transparent";
/** A point's own colours, which the library gives the stretch that starts at it: none of it shows. */
const GAP = {
  color: HIDDEN,
  lineColor: HIDDEN,
  topColor: HIDDEN,
  bottomColor: HIDDEN,
  topLineColor: HIDDEN,
  bottomLineColor: HIDDEN,
  topFillColor1: HIDDEN,
  topFillColor2: HIDDEN,
  bottomFillColor1: HIDDEN,
  bottomFillColor2: HIDDEN,
};

/**
 * The library's points. A null value becomes its "whitespace", a time with no value; the library would still join
 * the points either side, so the last point before a gap hides the stretch across it.
 */
function points(series: TimeSeriesChartSeries) {
  if (series.type === "candlestick") return series.data.map((candle) => ({ ...candle, time: chartTime(candle.time) }));
  return series.data.map(({ time: at, value }, i, data) => {
    const time = chartTime(at);
    if (value === null) return { time };
    return data[i + 1]?.value === null && series.type !== "histogram" ? { time, value, ...GAP } : { time, value };
  });
}

const twoDecimals = (value: number) => `${value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;

const fade = (color: string) => `color-mix(in oklch, ${color} 30%, transparent)`;

function seriesColors(series: TimeSeriesChartSeries, color: ThemeColor) {
  const up = color("--positive");
  const down = color("--negative");
  switch (series.type) {
    case "candlestick":
      return { upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false };
    case "baseline":
      return {
        topLineColor: up,
        topFillColor1: fade(up),
        topFillColor2: "transparent",
        bottomLineColor: down,
        bottomFillColor1: "transparent",
        bottomFillColor2: fade(down),
      };
    case "area": {
      const line = color(series.color);
      return { lineColor: line, topColor: fade(line), bottomColor: "transparent" };
    }
    default:
      return { color: color(series.color) };
  }
}

/** A pane's events as markers on its first series, each moved back to the last point at or before its time. */
function markers(panes: TimeSeriesChartPane[], events: Events, pane: number, color: string): SeriesMarker<Time>[] {
  const data = panes[pane]?.series[0]?.data ?? [];
  return (events ?? [])
    .filter((event) => (event.pane ?? 0) === pane)
    .flatMap(({ time, label }) => {
      const at = timeSeconds(chartTime(time));
      const point = data.findLast((candidate) => timeSeconds(chartTime(candidate.time)) <= at);
      if (!point) return [];
      return [{ time: chartTime(point.time), text: label, position: "aboveBar", shape: "arrowDown", color } as const];
    })
    .toSorted((a, b) => timeSeconds(a.time) - timeSeconds(b.time));
}

/**
 * The library's chart for one set of panes and series types, and what the component tells it: the data, the range
 * and the layout. It lives until the panes change shape, so the reader's zoom outlasts every change of data.
 */
class Drawing {
  private readonly themed: ThemedChart;
  /** The library's series, by pane then by place in the pane. */
  private readonly lines: ISeriesApi<SeriesType>[][];
  private readonly rules: IPriceLine[][];
  private readonly markers: ISeriesMarkersPluginApi<Time>[];
  private readonly stopListening: () => void;
  private panes: TimeSeriesChartPane[] = [];
  private events: Events;
  private range: TimeSeriesChartRange = "All";
  /** When the reader last dragged, pinched or turned the wheel over the plot, to tell their zoom from the chart's own. */
  private touched = Number.NEGATIVE_INFINITY;
  /** The reader moved the view by hand: new data leaves it where they put it. */
  private held = false;
  /** The first point's time; data from another start is another series, and is framed afresh. */
  private start: number | undefined;
  /** Removed for a new chart, which the effects that fill it reach on the next render. */
  private removed = false;

  constructor(
    element: HTMLElement,
    credit: boolean,
    structure: string,
    private readonly onValues: (values: string[][]) => void,
    onZoom: () => void,
  ) {
    this.themed = createThemedChart(element, credit, (color) => this.paint(color));
    const { chart } = this.themed;
    chart.applyOptions({ timeScale: { minimumHeight: TIME_AXIS } });
    this.lines = structure
      .split("|")
      .map((kinds, p) =>
        kinds
          .split(",")
          .map((kind) =>
            chart.addSeries(
              SERIES[kind as Kind] as SeriesDefinition<SeriesType>,
              { priceLineVisible: false, lineWidth: 2 },
              p,
            ),
          ),
      );
    this.rules = this.lines.map(() => []);
    this.markers = this.lines.flatMap(([first]) => (first ? [createSeriesMarkers(first)] : []));
    chart.subscribeCrosshairMove((param) => onValues(this.read(param)));
    // The view also changes when the chart frames a range, takes new data or resizes; only a change the reader's
    // own hand is behind makes it theirs.
    const touch = (event: Event) => {
      if (event.type !== "pointermove" || (event as PointerEvent).buttons) this.touched = event.timeStamp;
    };
    const gestures = ["pointerdown", "pointermove", "wheel", "dblclick"];
    gestures.forEach((gesture) => element.addEventListener(gesture, touch, { passive: true }));
    this.stopListening = () => gestures.forEach((gesture) => element.removeEventListener(gesture, touch));
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      if (this.held || performance.now() - this.touched > GESTURE_MS) return;
      this.held = true;
      onZoom();
    });
  }

  remove() {
    this.removed = true;
    this.stopListening();
    this.themed.remove();
  }

  /** A range the page or the reader picks takes the view back from the reader's own panning. */
  show(range: TimeSeriesChartRange) {
    if (this.removed) return;
    this.range = range;
    this.held = false;
    this.frame();
  }

  fill(panes: TimeSeriesChartPane[], events: Events, locale: SiyahiLocale) {
    if (this.removed) return;
    this.panes = panes;
    this.events = events;
    const timeScale = this.themed.chart.timeScale();
    // A held view is put back after new data: at the first point, where panning stops, the library would move it on
    // by the new points.
    const view = timeScale.getVisibleLogicalRange();
    panes.forEach(({ series, format: write = twoDecimals }, p) => {
      series.forEach((item, s) => {
        const line = this.lines[p]?.[s];
        line?.applyOptions({
          priceFormat: {
            type: "custom",
            formatter: write,
            tickmarksFormatter: (prices: BarPrice[]) => this.ticks(p, prices, write),
          },
          ...(item.type === "baseline" && { baseValue: { type: "price", price: item.base ?? 0 } }),
        });
        line?.setData(points(item));
      });
    });
    const start = panes[0]?.series[0]?.data[0]?.time;
    const labels = timeLabels(locale, typeof start === "number");
    this.themed.chart.applyOptions({
      localization: { locale: locale.numberLocale, timeFormatter: labels.crosshair },
      timeScale: { timeVisible: typeof start === "number", tickMarkFormatter: labels.tick },
    });
    this.themed.paint();
    const startsAt = start === undefined ? undefined : timeSeconds(chartTime(start));
    if (startsAt !== this.start) this.held = false;
    this.start = startsAt;
    if (!this.held) this.frame();
    else if (view) timeScale.setVisibleLogicalRange(view);
    this.onValues(this.read());
  }

  layout(panes: TimeSeriesChartPane[], width: number, scale: AxisScale) {
    if (this.removed) return;
    const heights = paneHeights(panes, width);
    this.themed.chart.panes().forEach((pane, p) => {
      const height = heights[p];
      const series = panes[p]?.series;
      if (!height || !series) return;
      pane.setStretchFactor(height);
      // One legend line per series, as TradingView stacks them, so a phone never wraps one over the lines.
      const legend = 2 * LEGEND_GAP + series.length * LEGEND_ROW;
      // Volume bars stand on the pane's floor, as a bar's length is its value.
      const bars = series.some(({ type }) => type === "histogram");
      pane.priceScale("right").applyOptions({
        scaleMargins: { top: legend / height, bottom: bars ? 0 : 0.1 },
        mode: p === 0 && scale === "log" ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      });
    });
  }

  private paint(color: ThemeColor) {
    const muted = color("--muted-foreground");
    this.panes.forEach(({ series, levels = [] }, p) => {
      series.forEach((item, s) => this.lines[p]?.[s]?.applyOptions(seriesColors(item, color)));
      this.markers[p]?.setMarkers(markers(this.panes, this.events, p, muted));
      const first = this.lines[p]?.[0];
      if (!first) return;
      // Drawn afresh each time: the library measures a level's label once, for the life of its line, so a line
      // made before the page's font loaded would keep the fallback's width.
      this.rules[p]?.forEach((rule) => first.removePriceLine(rule));
      this.rules[p] = levels.map(({ value, label: title = "" }) =>
        first.createPriceLine({ price: value, title, color: muted, lineStyle: LineStyle.Dashed, lineWidth: 1 }),
      );
    });
  }

  /**
   * A pane's axis ticks, less any that a value tag covers: the library draws each series' latest value and each
   * level as an opaque tag over the ticks, which would leave half a number showing.
   */
  private ticks(p: number, prices: BarPrice[], write: (value: number) => string): string[] {
    const lines = this.lines[p] ?? [];
    const [first] = lines;
    const fontSize = this.themed.chart.options().layout.fontSize;
    // A tag is the font's height and the library's 2.5px above and below per 12px of font; a tick, the font's height.
    const reach = (fontSize + (fontSize * 17) / 12) / 2;
    const tags = [
      ...lines.flatMap((line) => {
        const last = line.lastValueData(false);
        return last.noData ? [] : [last.price];
      }),
      ...(this.panes[p]?.levels ?? []).map(({ value }) => value),
    ].flatMap((price) => first?.priceToCoordinate(price) ?? []);
    return prices.map((price) => {
      const y = first?.priceToCoordinate(price) ?? null;
      return y !== null && tags.some((tag) => Math.abs(tag - y) < reach) ? "" : write(price);
    });
  }

  /** Shows the range up to the last point, or everything when the data is shorter than the range. */
  private frame() {
    const data = this.panes[0]?.series[0]?.data ?? [];
    const first = data[0]?.time;
    const last = data.at(-1)?.time;
    if (first === undefined || last === undefined) return;
    const timeScale = this.themed.chart.timeScale();
    const months = RANGE_MONTHS[this.range];
    const from = new Date(timeSeconds(chartTime(last)) * 1000);
    if (months !== undefined) from.setUTCMonth(from.getUTCMonth() - months);
    if (months === undefined || from.getTime() / 1000 <= timeSeconds(chartTime(first))) {
      timeScale.fitContent();
      return;
    }
    const start = typeof last === "number" ? from.getTime() / 1000 : from.toISOString().slice(0, 10);
    timeScale.setVisibleRange({ from: chartTime(start), to: chartTime(last) });
  }

  /** Each legend's values: every series at the crosshair's time, or its latest off the plot, where it has none. */
  private read({ time, seriesData }: Partial<MouseEventParams> = {}): string[][] {
    return this.panes.map(({ series }, p) =>
      series.map((item, s) => {
        const line = this.lines[p]?.[s];
        if (!line) return "—";
        const write = (value: number) => line.priceFormatter().format(value);
        const latest = () =>
          item.type === "candlestick" ? item.data.at(-1) : item.data.findLast(({ value }) => value !== null);
        const point = time === undefined ? latest() : seriesData?.get(line);
        if (!point) return "—";
        if ("close" in point) {
          return `O ${write(point.open)} H ${write(point.high)} L ${write(point.low)} C ${write(point.close)}`;
        }
        return "value" in point && typeof point.value === "number" ? write(point.value) : "—";
      }),
    );
  }
}

/** A series' square in the legend: its colour, or the gain and loss colours side by side when it draws in both. */
const swatch = (series: TimeSeriesChartSeries) =>
  series.type === "candlestick" || series.type === "baseline"
    ? { backgroundImage: "linear-gradient(90deg, var(--positive) 50%, var(--negative) 50%)" }
    : { backgroundColor: series.color };

/**
 * Series over time in panes on one time axis, TradingView style: lines, areas, volume bars, a gain and loss
 * baseline or candlesticks. Dragging pans, a pinch or the wheel (after a click into the chart) zooms, and the
 * crosshair moves every pane together; each pane's legend gives every series' value at the crosshair's time, or
 * its latest.
 */
export function TimeSeriesChart({
  panes,
  events,
  range,
  onZoom,
  scale = "linear",
  placeholder,
  credit = true,
  "aria-label": label,
}: TimeSeriesChartProps) {
  const locale = useLocale();
  const [root, width] = useElementWidth<HTMLDivElement>();
  // State, not a ref: the plot is absent while a placeholder stands in for it, and the chart is made when it arrives.
  const [plot, setPlot] = useState<HTMLDivElement | null>(null);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [values, setValues] = useState<string[][]>([]);
  const zoomed = useRef(onZoom);
  const structure = panes.map(({ series }) => series.map(({ type = "line" }) => type).join()).join("|");

  useEffect(() => {
    zoomed.current = onZoom;
  }, [onZoom]);

  useEffect(() => {
    if (!plot || !structure) return;
    const made = new Drawing(plot, credit, structure, setValues, () => zoomed.current?.());
    setDrawing(made);
    return () => made.remove();
  }, [plot, credit, structure]);

  useEffect(() => {
    if (range) drawing?.show(range);
  }, [drawing, range]);

  useEffect(() => drawing?.fill(panes, events, locale), [drawing, panes, events, locale]);

  useEffect(() => drawing?.layout(panes, width, scale), [drawing, panes, width, scale]);

  const heights = paneHeights(panes, width);
  const tops = heights.map((_, p) => heights.slice(0, p).reduce((top, height) => top + height + DIVIDER, 0));
  const height = heights.reduce((sum, paneHeight) => sum + paneHeight + DIVIDER, -DIVIDER) + TIME_AXIS;
  return (
    <div
      ref={root}
      data-slot="time-series-chart"
      role={label ? "figure" : undefined}
      aria-label={label}
      className="relative w-full font-mono text-xs"
      style={{ height }}
    >
      {placeholder ? (
        <div data-slot="chart-placeholder" className="flex h-full items-center justify-center">
          {placeholder}
        </div>
      ) : (
        <>
          <div ref={setPlot} className="absolute inset-0" />
          {panes.map((pane, p) => (
            <ul
              // Panes are told apart by place: two may hold series of the same names.
              // oxlint-disable-next-line react/no-array-index-key
              key={p}
              data-slot="time-series-chart-legend"
              className="pointer-events-none absolute left-1 z-10"
              style={{ top: (tops[p] ?? 0) + LEGEND_GAP }}
            >
              {pane.series.map((series, s) => (
                <li key={series.label} className="flex h-4 items-center gap-1.5">
                  <span className="size-2 shrink-0" style={swatch(series)} />
                  <span className="text-muted-foreground">{series.label}</span>
                  <span className="tabular-nums">{values[p]?.[s]}</span>
                </li>
              ))}
            </ul>
          ))}
        </>
      )}
    </div>
  );
}
