import type { ReactNode } from "react";
import { AreaChart, BarChart, CartesianGrid, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@siyahi/ui/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@siyahi/ui/components/ui/chart";
import type { ChartSeries, ChartSeriesItem, SeriesChartProps } from "@siyahi/ui/lib/chart-series";

/** The series in draw order, keyed by the field each reads. */
export function seriesEntries<T>(series: ChartSeries<T>): [string, ChartSeriesItem][] {
  return Object.entries(series).filter((entry): entry is [string, ChartSeriesItem] => Boolean(entry[1]));
}

interface ChartFrameProps<T extends object, K extends keyof T> extends SeriesChartProps<T, K> {
  chart: typeof AreaChart | typeof BarChart | typeof LineChart;
  /** One Bar, Area or Line per series. */
  children: ReactNode;
}

/** A tooltip row: the series' colour and label, then its value as the page formats it. */
function seriesRow<T>(series: ChartSeries<T>, formatValue: (value: number) => string) {
  return (value: unknown, _name: unknown, item: { dataKey?: unknown }) => {
    const entry = series[item.dataKey as keyof T];
    return (
      <>
        <span className="size-2.5 shrink-0 rounded-xs" style={{ backgroundColor: entry?.color }} />
        <span className="text-muted-foreground">{entry?.label}</span>
        <span className="ml-auto font-mono font-medium text-foreground tabular-nums">{formatValue(Number(value))}</span>
      </>
    );
  };
}

/**
 * The card, axes, grid, tooltip and legend the three chart cards share. Both
 * axes keep Recharts' default ids: marks find their axes by id, and a page
 * that gave its category axis its own id (dash#88) got a plot split in two
 * and every tooltip headed with the series name instead of the category.
 */
export function ChartFrame<T extends object, K extends keyof T>({
  chart: Chart,
  children,
  title,
  description,
  action,
  data,
  xKey,
  series,
  xFormatter = String,
  valueFormatter,
  yTickFormatter,
  height,
}: ChartFrameProps<T, K>) {
  const { numberLocale } = useLocale();
  const formatValue = valueFormatter ?? new Intl.NumberFormat(numberLocale).format;
  const entries = seriesEntries(series);
  const config: ChartConfig = Object.fromEntries(entries);
  const crossesZero = data.some((row) => entries.some(([key]) => Number(row[key as keyof T]) < 0));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
          <Chart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey as string}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: T[K]) => xFormatter(value)}
              tick={{ className: "font-mono" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width="auto"
              tickFormatter={yTickFormatter ?? formatValue}
              tick={{ className: "font-mono" }}
            />
            {crossesZero && <ReferenceLine y={0} stroke="var(--border)" />}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  // The heading comes from the hovered row, not Recharts' label,
                  // which is the series name whenever the category is not a string.
                  labelFormatter={(_, payload) => {
                    const row = payload[0]?.payload as T | undefined;
                    return row ? xFormatter(row[xKey]) : null;
                  }}
                  formatter={seriesRow(series, formatValue)}
                />
              }
            />
            {children}
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
          </Chart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
