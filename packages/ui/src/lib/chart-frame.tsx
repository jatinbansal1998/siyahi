import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from "react";
import { cn } from "@siyahi/ui/lib/utils";
import {
  AreaChart,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Text,
  XAxis,
  YAxis,
  useChartWidth,
  useXAxisTicks,
  useYAxisTicks,
  type YAxisProps,
} from "recharts";
import { LOG_BLOCKED, useAxisScale } from "@siyahi/ui/components/siyahi/scale-toggle";
import { StaleNote } from "@siyahi/ui/components/siyahi/stale-note";
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
import type {
  ChartColor,
  ChartCurve,
  ChartReferenceLine,
  ChartSeries,
  ChartSeriesItem,
  LineMarksProps,
  NumericXProps,
  SeriesChartProps,
  ValueScaleProps,
} from "@siyahi/ui/lib/chart-series";
import { EndLabels, QUIET, TimeMarks, endLabelRoom, endLabelsFit, linesEndAtEdge } from "@siyahi/ui/lib/chart-marks";
import { fitsLog, logAxis } from "@siyahi/ui/lib/ticks";
import { useElementWidth } from "@siyahi/ui/lib/use-element-width";

const AXIS_TITLE = "fill-muted-foreground text-xs";
// Recharts 3.8 draws tick labels in a layer of their own, which the core chart's
// muted-tick rule no longer reaches, so they would keep Recharts' #666 in both schemes.
const TICK = { className: "fill-muted-foreground font-mono" };
const NO_LINES: readonly ChartReferenceLine[] = [];
// Five series' names do not fit one line on a phone; they wrap rather than run past the card.
const SERIES_LEGEND = <ChartLegendContent className="flex-wrap gap-y-1" />;

/**
 * A bar's fill: a tint of its colour, inside a 1px edge of the full colour the bar is drawn with. A stack's segments
 * take the theme's stronger --stack-tint, so a thin one still shows its colour between its edges. A selection dims
 * the bars it leaves out to a fainter tint; their edges stay, so they keep 3:1 against the card.
 */
export function barFill(
  color: string,
  { stacked = false, dim = false }: { stacked?: boolean | undefined; dim?: boolean | undefined } = {},
): string {
  const share = dim ? "10%" : stacked ? "var(--stack-tint)" : "25%";
  return `color-mix(in oklab, ${color} ${share}, var(--card))`;
}

/** Renders the component again once the page's fonts load, so text measured on a canvas is measured in Geist. */
function useRenderWhenFontsLoad(): void {
  const [loaded, setLoaded] = useState(() => typeof document === "undefined" || document.fonts?.status === "loaded");
  useEffect(() => {
    if (loaded || !document.fonts) return;
    let live = true;
    void document.fonts.ready.then(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [loaded]);
}

interface QuietLegendProps<T> {
  series: ChartSeries<T>;
  /** The marks are lines a raised copy can trace; a stack's bands are not, so its grey names stay plain. */
  raisable: boolean;
  raised: ChartSeriesItem<T>["key"] | undefined;
  onRaise: (key: ChartSeriesItem<T>["key"] | undefined) => void;
}

/**
 * The legend when some series are quiet: every series by name. The grey ones share a colour, so a legend square
 * cannot say which line is which; on lines each grey name is a button that raises its line in the text colour, over
 * the rest. A stack's grey bands sit in the legend's order, bottom to top.
 */
export function QuietLegend<T>({ series, raisable, raised, onRaise }: QuietLegendProps<T>) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3"
      // Recharts reads focus and keys anywhere in the chart as the keyboard moving along the plot, and opens the
      // tooltip over the lines; a legend name taking focus or Enter is not that.
      onFocus={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {series.map(({ key, label, color }) =>
        raisable && color === QUIET ? (
          <button
            key={key}
            type="button"
            aria-pressed={raised === key}
            onClick={() => onRaise(raised === key ? undefined : key)}
            className="flex items-center gap-1.5 text-muted-foreground aria-pressed:text-foreground"
          >
            <div className="size-2 shrink-0 bg-current" />
            {label}
          </button>
        ) : (
          <div key={key} className={cn("flex items-center gap-1.5", color === QUIET && "text-muted-foreground")}>
            <div className="size-2 shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ),
      )}
    </div>
  );
}

/**
 * A reference line over a card-coloured band, so it stays traceable where it crosses a bar or an area: the text
 * colour on --chart-1 is only 2:1, but each against the card is well over 3:1.
 */
function haloLine({ x1, y1, x2, y2, stroke, strokeDasharray }: SVGProps<SVGLineElement>) {
  return (
    <g>
      <line data-slot="reference-line-halo" x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--card)" strokeWidth={4} />
      <line
        className="recharts-reference-line-line"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        strokeWidth={1}
      />
    </g>
  );
}

interface ChartFrameProps<T extends object, K extends keyof T>
  extends Omit<SeriesChartProps<T, K>, "yDomain">, NumericXProps, ValueScaleProps, LineMarksProps<T, K> {
  chart: typeof AreaChart | typeof BarChart | typeof LineChart;
  /** The value axis' range: a page's fixed one, or a card's rule such as bars reaching zero. */
  yDomain?: YAxisProps["domain"] | undefined;
  /** One Bar, Area or Line per series. */
  children: ReactNode;
  /**
   * Bars run sideways: the categories go down the left, where long names fit, as in shadcn's
   * chart-bar-horizontal. The value axis runs along the bottom when yTickFormatter is given, and is hidden
   * otherwise. x and y keep their meaning: x is the category, y the value.
   */
  horizontal?: boolean | undefined;
  /** "sign" stacks negative values below zero and positive ones above, rather than on one running total. */
  stackOffset?: "sign" | undefined;
  onClick?: ComponentProps<typeof BarChart>["onClick"] | undefined;
  /** A tooltip row per hovered mark; by default each series' colour, label and formatted value (seriesRow). */
  tooltipRow?: ComponentProps<typeof ChartTooltipContent>["formatter"] | undefined;
  /** The legend under the plot; by default one chip per series. */
  legend?: ReactElement | undefined;
  /** Why this chart cannot go on a log scale whatever its values, such as stacked areas adding up from zero. */
  logBlocked?: string | undefined;
  /** The marks are lines (a line chart, unstacked areas): name each series at its line's end, where there is room. */
  endLabels?: boolean | undefined;
  /** Hatch a forecast stretch, behind lines that sit on card halos; a stack's fills cover it already. */
  forecastHatch?: boolean | undefined;
  /** The lines' curve, which a grey line raised from the legend is drawn with too. */
  curve?: ChartCurve | undefined;
}

/**
 * The colour a series' Bar takes, which its legend chip shows: the negative colour when every value drawn is below
 * zero, since each bar's own Cell follows its sign but the chip follows the Bar.
 */
export function seriesFill<T>(item: ChartSeriesItem<T>, data: readonly T[]): ChartColor {
  const values = data
    .map((row) => row[item.key as keyof T])
    .filter((value) => Number.isFinite(value))
    .map(Number);
  return item.negativeColor && values.length > 0 && values.every((value) => value < 0)
    ? item.negativeColor
    : item.color;
}

/**
 * A Line or Area's dots: one solid dot on the latest point, ringed in the card's colour so it stands clear of the
 * grid, and none elsewhere. The eye lands on now, where a reader starts.
 */
export function endDot(color: ChartColor, count: number, hollow = false) {
  return ({ cx, cy, index }: { cx?: number | undefined; cy?: number | undefined; index?: number | undefined }) =>
    index === count - 1 && cx !== undefined && cy !== undefined ? (
      hollow ? (
        // A forecast's end is not a reading: the dot is hollow.
        <circle key="end" cx={cx} cy={cy} r={3.5} fill="var(--card)" stroke={color} strokeWidth={1.5} />
      ) : (
        <circle key="end" cx={cx} cy={cy} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
      )
    ) : (
      <g key={index} />
    );
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
  x?: number | string | undefined;
  y?: number | string | undefined;
  payload?: { value?: unknown } | undefined;
}

interface ValueTickProps extends Omit<ComponentProps<typeof Text>, "children"> {
  payload?: { value?: unknown } | undefined;
  /** The axis that carries the values: y, or x when the bars run sideways. */
  axis: "x" | "y";
  formatter: (value: number, scale: number) => string;
  /** Each tick in its own unit, as on a log axis, whose ticks run across powers of ten: ₹20,000, ₹1L, ₹5Cr. */
  ownUnit?: boolean | undefined;
}

/**
 * A value-axis tick formatted against the axis' largest tick, so every label shares one unit: ₹1.6L down to ₹0.4L,
 * never ₹80,000 halfway up. Recharts' tickFormatter sees one value at a time; the axis' ticks come from its hooks.
 * The rest of Recharts' tick props pass on as its own tick does, including the class it measures an auto width by.
 */
function ValueTick({ payload, axis, formatter, ownUnit = false, ...tick }: ValueTickProps) {
  const xTicks = useXAxisTicks();
  const yTicks = useYAxisTicks();
  const value = Number(payload?.value);
  const ticks = (axis === "x" ? xTicks : yTicks) ?? [];
  const scale = ownUnit ? Math.abs(value) : Math.max(Math.abs(value), ...ticks.map((t) => Math.abs(Number(t.value))));
  return <Text {...tick}>{formatter(value, scale)}</Text>;
}

// At the ticks' 12px, Geist averages about 6.6px a character and Geist Mono 7.2px.
const GEIST_WIDTH = 6.6;
const MONO_WIDTH = 7.2;

/**
 * Room to keep right of the plot when every named tick is drawn: half the last label, which centres on the
 * domain's right end, and at least 24px.
 */
function endRoom<V>(xFormatter: (value: V) => string, xTicks: readonly V[]): number {
  const last = xTicks.at(-1);
  return Math.max(24, Math.ceil((last === undefined ? 0 : xFormatter(last).length * MONO_WIDTH) / 2) + 4);
}

/**
 * An x tick with a second line or explicit position: Recharts'
 * own ticks would rather drop a label than let it run into the next. With a detail, the second line comes from the
 * tick's row; under a column the lines hang below the axis, and beside a horizontal bar they straddle its middle.
 * A two-line tick is set in Geist, not Mono: a name with a figure under it reads as a label, as in BarList, and
 * category names in Mono would take most of a phone's width.
 */
function fittedTick<T extends object, K extends keyof T>(
  data: readonly T[],
  xKey: K,
  xFormatter: (value: T[K]) => string,
  detailOf: ((row: T) => string) | undefined,
  beside: boolean,
  labelWidth?: number,
) {
  const rows = new Map<T[K], T>();
  for (const row of data) if (!rows.has(row[xKey])) rows.set(row[xKey], row);
  return ({ x, y, payload }: TickProps) => {
    const value = payload?.value as T[K];
    const row = rows.get(value);
    const name = xFormatter(value);
    const detail = row && detailOf ? detailOf(row) : null;
    if (beside) {
      return (
        <g className="fill-muted-foreground">
          <Text
            x={x}
            y={Number(y) - (detail ? 4 : 0)}
            width={labelWidth}
            maxLines={2}
            textAnchor="end"
            verticalAnchor={detail ? "end" : "middle"}
            lineHeight={14}
            style={{ fontSize: "var(--text-xs)" }}
            aria-label={name}
            className="recharts-cartesian-axis-tick-value fill-muted-foreground"
          >
            {name}
          </Text>
          {detail !== null && (
            <Text
              x={x}
              y={Number(y) + 4}
              width={labelWidth}
              textAnchor="end"
              verticalAnchor="start"
              lineHeight={14}
              style={{ fontSize: "var(--text-xs)", fontVariantNumeric: "tabular-nums" }}
              aria-label={detail}
              className="fill-muted-foreground tabular-nums"
            >
              {detail}
            </Text>
          )}
        </g>
      );
    }
    return (
      // Recharts measures text with this class to size an axis set to width="auto".
      <text
        x={x}
        y={y}
        textAnchor={beside ? "end" : "middle"}
        className={cn("recharts-cartesian-axis-tick-value fill-muted-foreground", !detailOf && "font-mono")}
      >
        <tspan x={x} dy={12}>
          {name}
        </tspan>
        {detail !== null && (
          <tspan x={x} dy={15} className="tabular-nums">
            {detail}
          </tspan>
        )}
      </text>
    );
  };
}

function HorizontalAxis<T extends object, K extends keyof T>({
  data,
  xKey,
  xFormatter,
  xTickDetail,
  xTicks,
}: Pick<SeriesChartProps<T, K>, "data" | "xKey" | "xTickDetail" | "xTicks"> & {
  xFormatter: (value: T[K]) => string;
}) {
  const width = Math.min(240, Math.floor((useChartWidth() ?? 320) * 0.45));
  return (
    <YAxis
      dataKey={xKey as string}
      type="category"
      width={width}
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      tickFormatter={xFormatter}
      interval={0}
      ticks={xTicks as (number | string)[] | undefined}
      tick={fittedTick(data, xKey, xFormatter, xTickDetail, true, width - 16)}
    />
  );
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
  onClick,
  tooltipRow,
  legend = SERIES_LEGEND,
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
  yScale = "linear",
  yScaleToggle = false,
  logBlocked,
  endLabels = false,
  forecastHatch = true,
  curve = "monotone",
  forecastFrom,
  today,
  stale,
}: ChartFrameProps<T, K>) {
  const { numberLocale } = useLocale();
  const clipId = useId();
  const [contentRef, contentWidth] = useElementWidth<HTMLDivElement>();
  // The names are measured as drawn, again once Geist has loaded: the fallback's widths are not Geist's.
  useRenderWhenFontsLoad();
  const [raisedKey, setRaisedKey] = useState<ChartSeriesItem<T>["key"]>();
  const names = endLabels ? series.map(({ label }) => label) : [];
  const labelRoom = endLabels ? endLabelRoom(names) : 0;
  // The plot's height under the card's top margin and the x axis: the names must fit it 14px apart.
  const plotHeight = height - 12 - (xTickDetail ? 40 : 30) - (xLabel ? 18 : 0);
  const ends =
    endLabels && linesEndAtEdge(data, xKey, series, xDomain) && endLabelsFit(names, contentWidth, plotHeight);
  const quiet = series.some(({ color }) => color === QUIET);
  // Only lines can be raised: a copy of a stacked band's series would trace its own values, not the band's edge.
  const raised = endLabels && !ends ? series.find(({ key, color }) => key === raisedKey && color === QUIET) : undefined;
  const formatValue = useMemo(
    () => valueFormatter ?? new Intl.NumberFormat(numberLocale).format,
    [valueFormatter, numberLocale],
  );
  const config: ChartConfig = Object.fromEntries(series.map(({ key, label, color }) => [key, { label, color }]));
  const crossesZero = data.some((row) => series.some(({ key }) => Number(row[key as keyof T]) < 0));
  const [low, high] = Array.isArray(yDomain) ? yDomain : [];
  const range = typeof low === "number" && typeof high === "number" ? ([low, high] as const) : undefined;
  // A page's fixed range must fit the log axis too, so its ends count as values.
  const values = [...data.flatMap((row) => series.map(({ key }) => row[key as keyof T])), ...(range ?? [])].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const valueAxis = useAxisScale({
    initial: yScale,
    toggle: yScaleToggle,
    label: yLabel ? `${yLabel} scale` : "Value axis scale",
    logBlocked: logBlocked ?? (fitsLog(values) ? undefined : LOG_BLOCKED),
  });
  const log = valueAxis.scale === "log" ? logAxis(values, range) : undefined;
  // Narrow panels need extra row space for complete quantitative details.
  const detailedRows = horizontal && xTickDetail !== undefined;
  const rowCount = (xTicks ?? data).length;
  const plotClass = detailedRows ? "min-h-(--wrapped-chart-height) @min-[24rem]/chart:min-h-0" : undefined;
  let minWidth: number | undefined;
  if (!horizontal && (xTicks || xTickDetail)) {
    const labelledValues = xTicks ?? data.map((row) => row[xKey]);
    let tickWidth = 0;
    for (const value of labelledValues) tickWidth = Math.max(tickWidth, xFormatter(value).length * MONO_WIDTH);
    if (xTickDetail) for (const row of data) tickWidth = Math.max(tickWidth, xTickDetail(row).length * GEIST_WIDTH);
    minWidth = Math.ceil((tickWidth + 12) * labelledValues.length + 64);
  }
  const plotStyle: CSSProperties = {
    height: detailedRows ? Math.max(height, rowCount * 72 + 48) : height,
    minWidth,
    ...(detailedRows ? { "--wrapped-chart-height": `${rowCount * 104 + 48}px` } : {}),
    // A series' actual and forecast copies clip to either side of forecastFrom (lib/chart-marks, siyahi.css).
    ...(forecastFrom !== undefined
      ? { "--chart-actual": `url(#${clipId}-actual)`, "--chart-forecast": `url(#${clipId}-forecast)` }
      : {}),
  };
  const endRight = !horizontal && xTicks ? endRoom(xFormatter, xTicks) : horizontal && yTickFormatter ? 28 : 8;
  return (
    <Card data-stale={stale ? "" : undefined}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {stale && <StaleNote since={stale} />}
        {(action || valueAxis.buttons) && (
          <CardAction className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {action}
            {valueAxis.buttons}
          </CardAction>
        )}
      </CardHeader>
      <CardContent
        ref={contentRef}
        className="@container/chart overflow-x-auto"
        role={minWidth ? "region" : undefined}
        aria-label={minWidth ? "Chart, scroll horizontally for all labelled values" : undefined}
        tabIndex={minWidth ? 0 : undefined}
      >
        {placeholder ? (
          <div
            data-slot="chart-placeholder"
            className={cn("flex items-center justify-center", plotClass)}
            style={plotStyle}
          >
            {placeholder}
          </div>
        ) : (
          <ChartContainer
            config={config}
            className={cn("aspect-auto w-full", plotClass, onClick && "cursor-pointer")}
            style={plotStyle}
          >
            <Chart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              stackOffset={stackOffset}
              onClick={onClick}
              // Selection reads the hovered category in this event; defer no pointer updates.
              throttledEvents={onClick ? [] : undefined}
              // Bottom-axis ticks need room at the right end; sideways labels already have the left axis.
              // A sideways chart's value axis ends in a centred tick label, which needs room past the plot.
              // Room above the plot for half the top tick label, so that label centres on its gridline.
              // With names at the line ends, the plot stops short of the card's edge and the names sit in that gutter.
              margin={{ top: 12, left: 0, right: ends ? Math.max(labelRoom, endRight) : endRight }}
            >
              <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
              {horizontal ? (
                <>
                  {/* The value axis shows along the bottom once a page gives it a tick format to read by. */}
                  <XAxis
                    type="number"
                    niceTicks="snap125"
                    hide={!yTickFormatter}
                    domain={yDomain}
                    ticks={yTicks as number[] | undefined}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={yTickFormatter ? <ValueTick axis="x" formatter={yTickFormatter} {...TICK} /> : TICK}
                  />
                  <HorizontalAxis
                    data={data}
                    xKey={xKey}
                    xFormatter={xFormatter}
                    xTickDetail={xTickDetail}
                    xTicks={xTicks}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey={xKey as string}
                    type={xDomain ? "number" : "category"}
                    domain={xDomain}
                    ticks={xTicks as (number | string)[] | undefined}
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
                  {/* Value ticks step by 1, 2, 2.5 or 5 × 10ⁿ: ₹0.5L, ₹1L, ₹1.5L, never ₹0.95L. */}
                  <YAxis
                    scale={valueAxis.scale}
                    niceTicks={log ? undefined : "snap125"}
                    tickLine={false}
                    axisLine={false}
                    width="auto"
                    domain={log?.domain ?? yDomain}
                    ticks={log?.ticks ?? (yTicks as number[] | undefined)}
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
                    // A page's formatter gets the axis' scale only when it asks for one: valueFormatter may read a second
                    // parameter of its own, such as pct's decimals.
                    tick={
                      yTickFormatter ? (
                        <ValueTick axis="y" formatter={yTickFormatter} ownUnit={log !== undefined} {...TICK} />
                      ) : (
                        TICK
                      )
                    }
                    tickFormatter={yTickFormatter ? undefined : (value: number) => formatValue(value)}
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
                  shape={haloLine}
                  strokeDasharray={at.y === undefined ? undefined : "4 4"}
                  label={
                    label === undefined
                      ? undefined
                      : {
                          value: label,
                          position: labelPosition,
                          // A halo in the card's colour keeps the label readable over a bar or an area it crosses.
                          className: "fill-muted-foreground stroke-card text-xs",
                          style: { paintOrder: "stroke", strokeWidth: 3, strokeLinejoin: "round" },
                        }
                  }
                />
              ))}
              <ChartTooltip
                // The core chart paints the band behind a hovered category in --muted; at full strength the pale
                // chart slots fell under 3:1 against it, so it shows at 40%.
                cursor={{ fillOpacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    // The heading comes from the hovered row, not Recharts' label,
                    // which is the series name whenever the category is not a string.
                    labelFormatter={(_, payload) => {
                      const row = payload[0]?.payload as T | undefined;
                      return row ? xTooltipFormatter(row[xKey]) : null;
                    }}
                    formatter={tooltipRow ?? seriesRow(series, formatValue)}
                  />
                }
              />
              {(forecastFrom !== undefined || today !== undefined) && (
                <TimeMarks
                  data={data}
                  xKey={xKey}
                  forecastFrom={forecastFrom}
                  today={today}
                  clipId={clipId}
                  hatch={forecastHatch}
                />
              )}
              {children}
              {raised &&
                // The raised grey line, over every other, solid up to a forecast and dashed after it like the rest.
                (forecastFrom === undefined ? ["solid"] : ["chart-actual", "chart-forecast"]).map((part) => (
                  <Line
                    key={`raised-${part}`}
                    dataKey={raised.key}
                    type={curve}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    strokeDasharray={part === "chart-forecast" ? "5 4" : undefined}
                    className={part === "solid" ? "chart-raised" : `chart-raised ${part}`}
                    dot={false}
                    activeDot={false}
                    tooltipType="none"
                    legendType="none"
                    isAnimationActive={false}
                  />
                ))}
              {ends ? (
                <EndLabels data={data} xKey={xKey} series={series} />
              ) : (
                <ChartLegend
                  content={
                    quiet ? (
                      <QuietLegend series={series} raisable={endLabels} raised={raised?.key} onRaise={setRaisedKey} />
                    ) : (
                      legend
                    )
                  }
                  itemSorter={null}
                />
              )}
            </Chart>
          </ChartContainer>
        )}
      </CardContent>
      {/* shadcn's chart blocks lay their footer out this way. */}
      {footer && <CardFooter className="flex-col items-start gap-2 text-sm">{footer}</CardFooter>}
    </Card>
  );
}
