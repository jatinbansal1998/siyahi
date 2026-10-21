import type { ReactNode } from "react";
import { cn } from "@siyahi/ui/lib/utils";
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
import type { ChartReferenceLine, ChartSeries, NumericXProps, SeriesChartProps } from "@siyahi/ui/lib/chart-series";

const AXIS_TITLE = "fill-muted-foreground text-xs";
// Recharts 3.8 draws tick labels in a layer of their own, which the core chart's
// muted-tick rule no longer reaches, so they would keep Recharts' #666 in both schemes.
const TICK = { className: "fill-muted-foreground font-mono" };
const NO_LINES: readonly ChartReferenceLine[] = [];

interface ChartFrameProps<T extends object, K extends keyof T> extends SeriesChartProps<T, K>, NumericXProps {
  chart: typeof AreaChart | typeof BarChart | typeof LineChart;
  /** One Bar, Area or Line per series. */
  children: ReactNode;
  /**
   * Bars run sideways: the categories go down the left, where long names fit, and the value axis is hidden, as
   * in shadcn's chart-bar-horizontal. x and y keep their meaning: x is the category, y the value.
   */
  horizontal?: boolean;
  /** "sign" stacks negative values below zero and positive ones above, rather than on one running total. */
  stackOffset?: "sign";
}

/** A tooltip row: the series' colour and label, then its value as the page formats it, or — when the row has none. */
export function seriesRow<T>(series: ChartSeries<T>, formatValue: (value: number) => string) {
  return (value: unknown, _name: unknown, item: { dataKey?: unknown }) => {
    const entry = series.find(({ key }) => key === item.dataKey);
    const color = entry?.negativeColor && Number(value) < 0 ? entry.negativeColor : entry?.color;
    return (
      <>
        <span className="size-2.5 shrink-0 rounded-xs" style={{ backgroundColor: color }} />
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
  /** The axis's length; with visibleTicksCount it gives each column's width. */
  width?: number | string;
  visibleTicksCount?: number;
  payload?: { value?: unknown };
}

// At the ticks' 12px, Geist averages about 6.6px a character and Geist Mono 7.2px.
const GEIST_WIDTH = 6.6;
const MONO_WIDTH = 7.2;

/** Squeezes a line into its column with SVG's own textLength when it would run into the next one. */
const fitTo = (text: string, room: number, charWidth: number) =>
  room > 0 && text.length * charWidth > room ? { textLength: room, lengthAdjust: "spacingAndGlyphs" as const } : {};

/**
 * An x tick fitted to its column, drawn whenever a page names its ticks or gives each a second line: Recharts'
 * own ticks would rather drop a label than let it run into the next. With a detail, the second line comes from the
 * tick's row; under a column the lines hang below the axis, and beside a horizontal bar they straddle its middle.
 * A two-line tick is set in Geist, not Mono: a name with a figure under it reads as a label, as in BarList, and
 * sector names in Mono would take most of a phone's width.
 */
function fittedTick<T extends object, K extends keyof T>(
  data: readonly T[],
  xKey: K,
  xFormatter: (value: T[K]) => string,
  detailOf: ((row: T) => string) | undefined,
  beside: boolean,
) {
  const charWidth = detailOf ? GEIST_WIDTH : MONO_WIDTH;
  return ({ x, y, width, visibleTicksCount, payload }: TickProps) => {
    const value = payload?.value as T[K];
    const row = data.find((r) => r[xKey] === value);
    const name = xFormatter(value);
    const detail = row && detailOf ? detailOf(row) : null;
    // Under a column each line gets its column's width, less a gap; beside a bar the axis is as wide as it needs.
    const room = beside || !visibleTicksCount ? 0 : Number(width) / visibleTicksCount - 6;
    return (
      // Recharts measures text with this class to size an axis set to width="auto".
      <text
        x={x}
        y={y}
        textAnchor={beside ? "end" : "middle"}
        className={cn("recharts-cartesian-axis-tick-value fill-muted-foreground", !detailOf && "font-mono")}
      >
        <tspan x={x} dy={beside ? -4 : 12} {...fitTo(name, room, charWidth)}>
          {name}
        </tspan>
        {detail !== null && (
          <tspan x={x} dy={15} className="tabular-nums" {...fitTo(detail, room, charWidth)}>
            {detail}
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
  horizontal = false,
  stackOffset,
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
  referenceLines = NO_LINES,
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
            <Chart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              stackOffset={stackOffset}
              // Every named tick is drawn, so one at the domain's right end needs room for its label.
              margin={{ left: 0, right: xTicks ? 24 : 8 }}
            >
              <CartesianGrid vertical={horizontal} horizontal={!horizontal} strokeDasharray="3 3" />
              {horizontal ? (
                <>
                  <XAxis type="number" hide domain={yDomain} ticks={yTicks as number[] | undefined} />
                  <YAxis
                    dataKey={xKey as string}
                    type="category"
                    width="auto"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: T[K]) => xFormatter(value)}
                    tick={xTickDetail ? fittedTick(data, xKey, xFormatter, xTickDetail, horizontal) : TICK}
                    interval={0}
                  />
                </>
              ) : (
                <>
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
                    tick={xTickDetail || xTicks ? fittedTick(data, xKey, xFormatter, xTickDetail, false) : TICK}
                    // Recharts' default drops a tick it thinks would collide or overflow; a page that
                    // names its ticks, or gives each a second line, wants every one drawn.
                    interval={xTickDetail || xTicks ? 0 : undefined}
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
                    // Recharts calls a tick formatter with (value, index); a page's formatter may
                    // read a second parameter of its own, such as pct's decimals, so it gets the value alone.
                    tickFormatter={(value: number) => (yTickFormatter ?? formatValue)(value)}
                    tick={TICK}
                  />
                </>
              )}
              {crossesZero &&
                (horizontal ? (
                  <ReferenceLine x={0} stroke="var(--border)" />
                ) : (
                  <ReferenceLine y={0} stroke="var(--border)" />
                ))}
              {referenceLines.map(({ label, emphasis = "muted", labelPosition = "insideTopLeft", ...at }) => (
                <ReferenceLine
                  key={`${at.x ?? ""}:${at.y ?? ""}:${label ?? ""}`}
                  // Sideways, a value level runs down the plot and a category mark across it.
                  {...(horizontal ? { x: at.y, y: at.x } : at)}
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
