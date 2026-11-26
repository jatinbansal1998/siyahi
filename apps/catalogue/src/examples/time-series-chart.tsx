import { useMemo } from "react";
import { TimeSeriesChartCard, useFormat, type TimeSeriesChartPane } from "@siyahi/ui";

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
// The first of the month is a Sunday; the note lands on the last session before it.
const events = [{ time: "2026-11-01", label: "Nov 2026" }];

export default function TimeSeriesChartExample() {
  const { count, pct } = useFormat();
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
    <TimeSeriesChartCard
      title="Foreign traders stayed net short index futures all year, retail traders net long"
      description="Each trading day's Nifty 50 close, then each group's index futures contracts long minus short, and the share of its contracts that is long. Made-up figures, December 2025 to November 2026."
      panes={panes}
      events={events}
      rangeToggle
    />
  );
}
