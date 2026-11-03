import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Money into and out of the account each month; out is negative. Made-up figures.
const data = [
  { month: "Jul", in: 84000, out: -52000 },
  { month: "Aug", in: 61000, out: -73000 },
  { month: "Sep", in: 92000, out: -48000 },
  { month: "Oct", in: 70000, out: -66000 },
];

const series: ChartSeries<(typeof data)[number]> = [
  { key: "in", label: "In", color: "var(--positive)" },
  { key: "out", label: "Out", color: "var(--negative)" },
];

export default function ChartBarFlowsExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <BarChartCard
      title="Cash in and out by month"
      description="Money in above the line, money out below it"
      data={data}
      xKey="month"
      series={series}
      stacked
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={256}
    />
  );
}
