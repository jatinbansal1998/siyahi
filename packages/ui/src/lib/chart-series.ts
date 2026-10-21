import type { ReactNode } from "react";

/** The colours a series may take: the five chart slots, and muted for an "Other" past five. */
export type ChartColor =
  | "var(--chart-1)"
  | "var(--chart-2)"
  | "var(--chart-3)"
  | "var(--chart-4)"
  | "var(--chart-5)"
  | "var(--muted-foreground)";

/** The fields of a row that hold numbers: the ones a series can plot. */
type NumericKey<T> = { [K in keyof T]-?: T[K] extends number | null | undefined ? K : never }[keyof T] & string;

/** One series: the field it plots, its name in the legend and tooltip, and its colour. */
export interface ChartSeriesItem<T> {
  key: NumericKey<T>;
  label: string;
  color: ChartColor;
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
export type ChartReferenceLine = ({ y: number; x?: never } | { x: number | string; y?: never }) & {
  label?: string;
  /** "strong" draws it in the text colour, for the line that matters most; "muted" by default. */
  emphasis?: "muted" | "strong";
  /** Where the label sits against the line. Defaults to insideTopLeft. */
  labelPosition?: "insideTopLeft" | "insideTopRight" | "insideBottomLeft" | "insideBottomRight";
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
  /** The x axis ticks, and the tooltip's heading unless xTooltipFormatter is set. Defaults to the value as text. */
  xFormatter?: (value: T[K]) => string;
  /** The tooltip's heading, when it should say more than a tick: "19:34:13 IST, 10 s average" against "19:34". */
  xTooltipFormatter?: (value: T[K]) => string;
  /** A series' value in the tooltip, and the y axis unless yTickFormatter is set. Defaults to the locale's numbers. */
  valueFormatter?: (value: number) => string;
  /** The y axis, when its ticks should be shorter than the tooltip's figures: moneyCompact against money. */
  yTickFormatter?: (value: number) => string;
  /** A fixed range for the value axis, such as [0, 100] for a percentage; by default it fits the data. */
  yDomain?: [number, number];
  /** Where the value axis puts its ticks, such as [0, 25, 50, 75, 100]. */
  yTicks?: readonly number[];
  /** Height of the plot and legend, in pixels. */
  height: number;
  /** Limits and events to mark on the plot. A zero line draws by itself when a value goes below zero. */
  referenceLines?: readonly ChartReferenceLine[];
  /** Shown in the plot's place, at its height, while the data loads or after it failed to. */
  placeholder?: ReactNode;
  /** Lines under the chart, such as a caption or a takeaway, in the card's footer. */
  footer?: ReactNode;
}

/** A numeric x axis, for samples in time or any measure where a mark can sit between two rows. */
export interface NumericXProps {
  /** The x axis runs over this range of the xKey field, which must hold numbers; without it the axis is one slot per row. */
  xDomain?: [number, number];
  /** Where the x axis puts its ticks, in the xKey field's units. */
  xTicks?: readonly number[];
}

/**
 * How a line or an area's edge joins its points: "linear" draws straight segments, as measured samples should
 * be drawn; "monotone", the default, smooths between them without overshooting a point.
 */
export type ChartCurve = "monotone" | "linear";
