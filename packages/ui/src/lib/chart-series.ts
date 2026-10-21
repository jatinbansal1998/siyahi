import type { ReactNode } from "react";

/** The colours a series may take: the five chart slots, and muted for an "Other" past five. */
export type ChartColor =
  | "var(--chart-1)"
  | "var(--chart-2)"
  | "var(--chart-3)"
  | "var(--chart-4)"
  | "var(--chart-5)"
  | "var(--muted-foreground)";

/** One series: its name in the legend and tooltip, and its colour. */
export interface ChartSeriesItem {
  label: string;
  color: ChartColor;
}

/**
 * The series to draw, keyed by the data field each one reads. Key order is
 * draw and legend order; give the slots in order from --chart-1.
 */
export type ChartSeries<T> = { [K in keyof T]?: ChartSeriesItem };

/** What BarChartCard, AreaChartCard and LineChartCard all take. */
export interface SeriesChartProps<T extends object, K extends keyof T> {
  title: ReactNode;
  description?: ReactNode;
  /** A range or mode toggle, top right of the card. */
  action?: ReactNode;
  /** One row per point on the axis, in axis order. */
  data: T[];
  /** The field the x axis reads: a month, an hour of day, a price bucket. */
  xKey: K;
  series: ChartSeries<NoInfer<T>>;
  /** The x axis ticks and the tooltip's heading. Defaults to the value as text. */
  xFormatter?: (value: T[K]) => string;
  /** A series' value in the tooltip, and the y axis unless yTickFormatter is set. Defaults to the locale's numbers. */
  valueFormatter?: (value: number) => string;
  /** The y axis, when its ticks should be shorter than the tooltip's figures: moneyCompact against money. */
  yTickFormatter?: (value: number) => string;
  /** Height of the plot and legend, in pixels. */
  height: number;
}
