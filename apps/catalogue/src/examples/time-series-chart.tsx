import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  TimeSeriesChart,
  useFormat,
  type TimeSeriesChartPane,
} from "@siyahi/ui";

// 250 made-up trading days from 1 December 2025: weekdays, as the exchange trades.
const days = Array.from({ length: 350 }, (_, i) => new Date(Date.UTC(2025, 11, 1 + i)))
  .filter((day) => ![0, 6].includes(day.getUTCDay()))
  .slice(0, 250)
  .map((day) => day.toISOString().slice(0, 10));
const series = (value: (i: number) => number) => days.map((time, i) => ({ time, value: value(i) }));

const nifty = series((i) => 24_200 + i * 8 + Math.sin(i / 25) * 600 + Math.sin(i / 4) * 120);
// Long minus short contracts: foreign traders short all year, retail traders taking the other side.
const foreignNet = series((i) => -70_000 - Math.sin(i / 40) * 35_000 - Math.sin(i / 7) * 10_000);
const retailNet = series((i) => 52_000 + Math.sin(i / 40) * 25_000 + Math.sin(i / 5) * 8_000);
const longShare = (net: { time: string; value: number }[], open: number) =>
  net.map(({ time, value }) => ({ time, value: 0.5 + value / open }));
const events = days
  .filter((day) => day.startsWith("2026-11"))
  .slice(0, 1)
  .map((time) => ({ time, label: "Nov 2026" }));

export default function TimeSeriesChartExample() {
  const { count, pct } = useFormat();
  // The chart redraws when it gets a new array, so the panes are made once.
  const panes = useMemo<TimeSeriesChartPane[]>(
    () => [
      { height: 180, series: [{ label: "Nifty 50 close", color: "var(--chart-1)", data: nifty }], format: count },
      {
        height: 120,
        series: [
          { label: "Foreign net contracts", color: "var(--chart-2)", data: foreignNet },
          { label: "Retail net contracts", color: "var(--chart-3)", data: retailNet },
        ],
        levels: [{ value: 0 }],
        format: (value) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${count(Math.abs(value))}`,
      },
      {
        height: 120,
        series: [
          { label: "Foreign share long", color: "var(--chart-2)", data: longShare(foreignNet, 300_000) },
          { label: "Retail share long", color: "var(--chart-3)", data: longShare(retailNet, 400_000) },
        ],
        levels: [{ value: 0.5, label: "half long" }],
        format: (value) => pct(value, 0),
      },
    ],
    [count, pct],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foreign traders stayed net short index futures all year, retail traders net long</CardTitle>
        <CardDescription>
          Each trading day&apos;s Nifty 50 close, then each group&apos;s index futures contracts long minus short, and
          the share of its contracts that is long. Made-up figures, December 2025 to November 2026.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TimeSeriesChart panes={panes} events={events} />
      </CardContent>
      <CardFooter>
        <span className="text-xs text-muted-foreground">
          Chart by{" "}
          <a
            className="text-link underline-offset-4 hover:underline"
            href="https://www.tradingview.com/lightweight-charts/"
          >
            TradingView Lightweight Charts
          </a>
        </span>
      </CardFooter>
    </Card>
  );
}
