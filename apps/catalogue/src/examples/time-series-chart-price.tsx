import { TimeSeriesChartCard, useFormat, type TimeSeriesChartPane } from "@siyahi/ui";

// A made-up daily series for five years: a fund's unit price, which grows about 16% a year.
const data = Array.from({ length: 1250 }, (_, i) => {
  const day = new Date(Date.UTC(2021, 10, 1 + Math.floor((i * 7) / 5)));
  return { time: day.toISOString().slice(0, 10), value: 100 * 1.0006 ** i * (1 + Math.sin(i / 60) * 0.08) };
});

export default function TimeSeriesChartPriceExample() {
  const { money } = useFormat();
  const panes: TimeSeriesChartPane[] = [
    {
      series: [{ type: "area", label: "Unit price", color: "var(--chart-1)", data }],
      format: (value) => money(value, 2),
    },
  ];
  return (
    <TimeSeriesChartCard
      title="The fund's unit price doubled in five years"
      description="Daily unit price, ₹. On Log, equal climbs are equal growth, so the steady rate reads as a straight line."
      panes={panes}
      range="1Y"
      rangeToggle
      yScaleToggle
      credit={false}
    />
  );
}
