import type { ReactNode } from "react";
import { AreaChart, BarChart, CartesianGrid, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { useLocale } from "@siyahi/ui/components/siyahi/siyahi-provider";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siyahi/ui/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@siyahi/ui/components/ui/chart";
import type { ChartSeries, NumericXProps, SeriesChartProps } from "@siyahi/ui/lib/chart-series";

const AXIS_TITLE = "fill-muted-foreground text-xs";

interface ChartFrameProps<T extends object, K extends keyof T> extends SeriesChartProps<T, K>, NumericXProps {
  chart: typeof AreaChart | typeof BarChart | typeof LineChart;
  /** One Bar, Area or Line per series. */
  children: ReactNode;
}

/** A tooltip row: the series' colour and label, then its value as the page formats it, or — when the row has none. */
export function seriesRow<T>(series: ChartSeries<T>, formatValue: (value: number) => string) {
  return (value: unknown, _name: unknown, item: { dataKey?: unknown }) => {
    const entry = series.find(({ key }) => key === item.dataKey);
    return (
      <>
        <span className="size-2.5 shrink-0 rounded-xs" style={{ backgroundColor: entry?.color }} />
        <span className="text-muted-foreground">{entry?.label}</span>
        <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
          {value == null ? "—" : formatValue(Number(value))}
        </span>
      </>
    );
  };
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
}

/**
 * An x tick with a second line from its row. Under a column the lines hang below the axis; beside a horizontal
 * bar they straddle its middle.
 */
function twoLineTick<T extends object, K extends keyof T>(
  data: readonly T[],
  xKey: K,
  xFormatter: (value: T[K]) => string,
  detailOf: (row: T) => string,
  beside: boolean,
) {
  return ({ x, y, payload }: TickProps) => {
    const value = payload?.value as T[K];
    const row = data.find((r) => r[xKey] === value);
    return (
      <text x={x} y={y} textAnchor={beside ? "end" : "middle"} className="font-mono">
        <tspan x={x} dy={beside ? -4 : 12}>
          {xFormatter(value)}
        </tspan>
        {row && (
          <tspan x={x} dy={15} className="font-sans tabular-nums">
            {detailOf(row)}
          </tspan>
        )}
      </text>
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
  xTooltipFormatter = xFormatter,
  valueFormatter,
  yTickFormatter,
  yDomain,
  yTicks,
  height,
  xTickDetail,
  xLabel,
  yLabel,
  referenceLines = [],
  placeholder,
  footer,
  xDomain,
  xTicks,
}: ChartFrameProps<T, K>) {
  const { numberLocale } = useLocale();
  const formatValue = valueFormatter ?? new Intl.NumberFormat(numberLocale).format;
  const config: ChartConfig = Object.fromEntries(series.map(({ key, label, color }) => [key, { label, color }]));
  const crossesZero = data.some((row) => series.some(({ key }) => Number(row[key as keyof T]) < 0));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {placeholder ? (
          <div data-slot="chart-placeholder" className="flex items-center justify-center" style={{ height }}>
            {placeholder}
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
            <Chart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey={xKey as string}
                type={xDomain ? "number" : "category"}
                domain={xDomain}
                ticks={xTicks as number[] | undefined}
                height={(xTickDetail ? 40 : 30) + (xLabel ? 18 : 0)}
                label={xLabel ? { value: xLabel, position: "insideBottom", className: AXIS_TITLE } : undefined}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: T[K]) => xFormatter(value)}
                tick={
                  xTickDetail ? twoLineTick(data, xKey, xFormatter, xTickDetail, false) : { className: "font-mono" }
                }
                interval={xTickDetail ? 0 : undefined}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width="auto"
                domain={yDomain}
                ticks={yTicks as number[] | undefined}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                        className: AXIS_TITLE,
                      }
                    : undefined
                }
                tickFormatter={yTickFormatter ?? formatValue}
                tick={{ className: "font-mono" }}
              />
              {crossesZero && <ReferenceLine y={0} stroke="var(--border)" />}
              {referenceLines.map(({ label, emphasis = "muted", labelPosition = "insideTopLeft", ...at }) => (
                <ReferenceLine
                  key={`${at.x ?? ""}:${at.y ?? ""}:${label ?? ""}`}
                  {...at}
                  stroke={emphasis === "strong" ? "var(--foreground)" : "var(--muted-foreground)"}
                  strokeDasharray={at.y === undefined ? undefined : "4 4"}
                  label={
                    label === undefined
                      ? undefined
                      : { value: label, position: labelPosition, className: "fill-muted-foreground text-xs" }
                  }
                />
              ))}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    // The heading comes from the hovered row, not Recharts' label,
                    // which is the series name whenever the category is not a string.
                    labelFormatter={(_, payload) => {
                      const row = payload[0]?.payload as T | undefined;
                      return row ? xTooltipFormatter(row[xKey]) : null;
                    }}
                    formatter={seriesRow(series, formatValue)}
                  />
                }
              />
              {children}
              <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
            </Chart>
          </ChartContainer>
        )}
      </CardContent>
      {/* shadcn's chart blocks lay their footer out this way. */}
      {footer && <CardFooter className="flex-col items-start gap-2 text-sm">{footer}</CardFooter>}
    </Card>
  );
}
