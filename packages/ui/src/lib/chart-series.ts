import type { ReactNode } from "react";
import type { AxisScale } from "@siyahi/ui/lib/ticks";

/**
 * The colours a series may take: the five chart slots, muted for an "Other" past five, and the two meaning
 * colours for a gain and a loss.
 */
export type ChartColor =
  | "var(--chart-1)"
  | "var(--chart-2)"
  | "var(--chart-3)"
  | "var(--chart-4)"
  | "var(--chart-5)"
  | "var(--muted-foreground)"
  | "var(--positive)"
  | "var(--negative)";

/** The fields of a row that hold numbers: the ones a series can plot. */
export type NumericKey<T> = { [K in keyof T]-?: T[K] extends number | null | undefined ? K : never }[keyof T] & string;

/** One series: the field it plots, its name in the legend and tooltip, and its colour. */
export interface ChartSeriesItem<T> {
  key: NumericKey<T>;
  label: string;
  color: ChartColor;
  /** A bar below zero takes this colour instead, such as var(--negative) for a loss beside var(--positive). */
  negativeColor?: ChartColor | undefined;
}

/**
 * The series in draw, stack and legend order; give the slots in order from
 * --chart-1. A list, not an object keyed by field, because an object puts
 * number-like keys such as "2024" first whatever order the page wrote them in.
 */
export type ChartSeries<T> = readonly ChartSeriesItem<T>[];

/**
 * A labelled line across the plot: a level on the value axis (y), such as a limit, or a point on the x axis, such
 * as an event. A level is dashed, an event solid.
 */
export type ChartReferenceLine = (
  | { y: number; x?: never | undefined }
  | { x: number | string; y?: never | undefined }
) & {
  label?: string | undefined;
  /** "strong" draws it in the text colour, for the line that matters most; "muted" by default. */
  emphasis?: "muted" | "strong" | undefined;
  /** Where the label sits against the line. Defaults to insideTopLeft. */
  labelPosition?: "insideTopLeft" | "insideTopRight" | "insideBottomLeft" | "insideBottomRight" | undefined;
};

/** What BarChartCard, AreaChartCard and LineChartCard all take. */
export interface SeriesChartProps<T extends object, K extends keyof T> {
  title: ReactNode;
  description?: ReactNode;
  /** A range or mode toggle, top right of the card. */
  action?: ReactNode;
  /** One row per point on the axis, in axis order. */
  data: T[];
  /** The field the x axis reads: a month, an hour of day, a price bucket. One row per value; a repeated value is hidden behind the first. */
  xKey: K;
  series: ChartSeries<NoInfer<T>>;
  /** Categories to label, or tick positions with xDomain. Every named tick is drawn; other rows keep their marks and tooltips. */
  xTicks?: readonly T[K][] | undefined;
  /** The x axis ticks, and the tooltip's heading unless xTooltipFormatter is set. Defaults to the value as text. */
  xFormatter?: ((value: T[K]) => string) | undefined;
  /** The tooltip's heading, when it should say more than a tick: "19:34:13 IST, 10 s average" against "19:34". */
  xTooltipFormatter?: ((value: T[K]) => string) | undefined;
  /** A series' value in the tooltip, and the y axis unless yTickFormatter is set. Defaults to the locale's numbers. */
  valueFormatter?: ((value: number) => string) | undefined;
  /**
   * The y axis, when its ticks should be shorter than the tooltip's figures: moneyCompact against money. It gets the
   * axis' largest tick as `scale`, so moneyCompact writes every tick in one unit.
   */
  yTickFormatter?: ((value: number, scale: number) => string) | undefined;
  /**
   * A fixed range for the value axis, such as [0, 100] for a percentage. By default it fits the data; a bar
   * chart's always reaches zero.
   */
  yDomain?: [number, number] | undefined;
  /** Where the value axis puts its ticks, such as [0, 25, 50, 75, 100]. */
  yTicks?: readonly number[] | undefined;
  /** Height of the plot and legend, in pixels. Sideways bars grow when wrapped tick details need more room. */
  height: number;
  /** A second line under each x tick, so a row's figure reads without a hover: "FY24" then "+₹1.2L". */
  xTickDetail?: ((row: T) => string) | undefined;
  /** A title under the x axis, such as "Hour of day (IST)". Not drawn on sideways bars. */
  xLabel?: string | undefined;
  /** A title beside the value axis, read bottom to top, such as "Orders". Not drawn on sideways bars. */
  yLabel?: string | undefined;
  /** Limits and events to mark on the plot. A zero line draws by itself when a value goes below zero. */
  referenceLines?: readonly ChartReferenceLine[] | undefined;
  /** Shown in the plot's place, at its height, while the data loads or after it failed to. */
  placeholder?: ReactNode;
  /** Lines under the chart, such as a caption or a takeaway, in the card's footer. */
  footer?: ReactNode;
  /**
   * Marks the data as old, with since when, such as "3 Nov": the chart greys out and a small "Stale · 3 Nov" note
   * sits under the title. The page decides; nothing is inferred from dates.
   */
  stale?: ReactNode;
}

/** What a chart of lines takes, LineChartCard and AreaChartCard: a forecast stretch and today. */
export interface LineMarksProps<T extends object, K extends keyof T> {
  /**
   * The x value from which the data is a forecast, such as the last month-end: each line goes dashed from it, a faint
   * hatched band labelled FORECAST covers the stretch, and the end dots are hollow.
   */
  forecastFrom?: NoInfer<T[K]> | undefined;
  /** The x value of today: a 1px rule in the link colour with a small TODAY label. */
  today?: NoInfer<T[K]> | undefined;
}

/** A numeric x axis, for samples in time or any measure where a mark can sit between two rows. */
export interface NumericXProps {
  /** The x axis runs over this range of the xKey field, which must hold numbers; without it the axis is one slot per row. */
  xDomain?: [number, number] | undefined;
}

/** A value axis that may run on a log scale: lines and areas, which need not start at zero as bars must. */
export interface ValueScaleProps {
  /**
   * "log" spreads values across powers of ten, for values that run from tiny to large; the first selection when
   * yScaleToggle is set. Log draws only when every value, and yDomain, is above zero; otherwise the axis is linear.
   * On log the axis ticks at 1, 2 and 5 inside yDomain, if given, and yTicks is not used.
   */
  yScale?: AxisScale | undefined;
  /** Linear and Log buttons for the value axis in the header, after the action, so a reader can switch. */
  yScaleToggle?: boolean | undefined;
}

/**
 * How a line or an area's edge joins its points: "linear" draws straight segments, as measured samples should
 * be drawn; "monotone", the default, smooths between them without overshooting a point.
 */
export type ChartCurve = "monotone" | "linear";
