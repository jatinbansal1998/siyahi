import { TimeSeriesChartCard, useFormat, type TimeSeriesChartPane } from "@siyahi/ui";

// A made-up daily series for five years: a fund's unit price, which grows about 16% a year.
const data = Array.from({ length: 1250 }, (_, i) => {
  const day = new Date(Date.UTC(2021, 10, 1 + Math.floor((i * 7) / 5)));
  return { time: day.toISOString().slice(0, 10), value: 100 * 1.0006 ** i * (1 + Math.sin(i / 60) * 0.08) };
});
// Three of them fall within four months, where a phone has no room to write them all.
const events = [
  { time: "2022-05-04", label: "rate rise" },
  { time: "2023-03-10", label: "bank failure abroad" },
  { time: "2024-06-04", label: "election results" },
  { time: "2024-07-23", label: "budget raises tax on gains" },
  { time: "2024-09-27", label: "market high" },
  { time: "2025-04-01", label: "fees cut" },
  { time: "2026-02-01", label: "budget" },
];

export default function TimeSeriesChartPriceExample() {
  const { money } = useFormat();
  const panes: TimeSeriesChartPane[] = [
    {
      series: [{ type: "area", label: "Unit price", color: "var(--chart-1)", data }],
      minHeight: 360,
      format: (value) => money(value, 2),
      tickFormat: (value) => money(value),
    },
  ];
  return (
    <TimeSeriesChartCard
      title="The fund's unit price doubled in five years"
      description="Daily unit price, ₹, with the news that moved it. On Log, equal climbs are equal growth, so the steady rate reads as a straight line."
      panes={panes}
      events={events}
      range="1Y"
      rangeToggle
      yScaleToggle
      credit={false}
    />
  );
}
