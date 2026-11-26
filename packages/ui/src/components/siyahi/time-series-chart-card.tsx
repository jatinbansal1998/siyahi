import { useState } from "react";
import { LOG_BLOCKED, useAxisScale } from "@siyahi/ui/components/siyahi/scale-toggle";
import { StaleNote } from "@siyahi/ui/components/siyahi/stale-note";
import {
  TimeSeriesChart,
  type TimeSeriesChartProps,
  type TimeSeriesChartRange,
} from "@siyahi/ui/components/siyahi/time-series-chart";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siyahi/ui/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@siyahi/ui/components/ui/toggle-group";
import type { SeriesChartProps, ValueScaleProps } from "@siyahi/ui/lib/chart-series";
import { fitsLog } from "@siyahi/ui/lib/ticks";

const RANGES: readonly TimeSeriesChartRange[] = ["1M", "6M", "1Y", "All"];

export interface TimeSeriesChartCardProps
  extends
    Pick<TimeSeriesChartProps, "panes" | "events" | "credit">,
    Pick<SeriesChartProps<object, never>, "title" | "description" | "action" | "placeholder" | "footer" | "stale">,
    ValueScaleProps {
  /** The range shown first; everything by default. */
  range?: TimeSeriesChartRange | undefined;
  /** 1M, 6M, 1Y and All buttons in the header. A reader who pans or zooms by hand leaves none of them selected. */
  rangeToggle?: boolean | undefined;
}

/**
 * TimeSeriesChart in a card: the title, description and stale note, range and scale buttons in the header, a
 * placeholder while the data loads, and TradingView's credit link in the footer.
 */
export function TimeSeriesChartCard({
  title,
  description,
  action,
  placeholder,
  footer,
  stale,
  range: firstRange = "All",
  rangeToggle = false,
  yScale = "linear",
  yScaleToggle = false,
  credit = true,
  ...chart
}: TimeSeriesChartCardProps) {
  const [range, setRange] = useState<TimeSeriesChartRange | undefined>(firstRange);
  const prices = (chart.panes[0]?.series ?? []).flatMap((series) =>
    series.type === "candlestick"
      ? series.data.map(({ low }) => low)
      : series.data.flatMap(({ value }) => (value === null ? [] : [value])),
  );
  const valueAxis = useAxisScale({
    initial: yScale,
    toggle: yScaleToggle,
    label: "Value axis scale",
    logBlocked: fitsLog(prices) ? undefined : LOG_BLOCKED,
  });
  const ranges = rangeToggle && (
    <ToggleGroup
      value={range ? [range] : []}
      // Pressing the selected range again would leave none selected; keep it.
      onValueChange={([next]) => setRange(RANGES.find((candidate) => candidate === next) ?? range)}
      variant="outline"
      size="sm"
      aria-label="Range"
    >
      {RANGES.map((item) => (
        <ToggleGroupItem key={item} value={item}>
          {item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
  return (
    <Card data-stale={stale ? "" : undefined}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {stale && <StaleNote since={stale} />}
        {(action || ranges || valueAxis.buttons) && (
          <CardAction className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {action}
            {ranges}
            {valueAxis.buttons}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <TimeSeriesChart
          {...chart}
          range={range}
          onZoom={() => setRange(undefined)}
          scale={valueAxis.scale}
          placeholder={placeholder}
          credit={credit}
          aria-label={typeof title === "string" ? title : undefined}
        />
      </CardContent>
      {(footer || credit) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer}
          {credit && (
            <span className="text-xs text-muted-foreground">
              Chart by{" "}
              <a
                className="text-link underline-offset-4 hover:underline"
                href="https://www.tradingview.com/lightweight-charts/"
              >
                TradingView Lightweight Charts
              </a>
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
