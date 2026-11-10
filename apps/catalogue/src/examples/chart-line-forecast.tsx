import { LineChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Net worth's growth against the plan since May; November and December are a forecast.
const worth = [
  { month: "May", actual: 0, plan: 0 },
  { month: "Jun", actual: 0.025, plan: 0.022 },
  { month: "Jul", actual: 0.061, plan: 0.044 },
  { month: "Aug", actual: 0.047, plan: 0.067 },
  { month: "Sep", actual: 0.11, plan: 0.089 },
  { month: "Oct", actual: 0.156, plan: 0.111 },
  { month: "Nov", actual: 0.177, plan: 0.133 },
  { month: "Dec", actual: 0.202, plan: 0.156 },
];
const series: ChartSeries<(typeof worth)[number]> = [
  { key: "actual", label: "Net worth", color: "var(--chart-1)" },
  { key: "plan", label: "Plan", color: "var(--chart-2)" },
];

// Today is a rule in the link colour; from forecastFrom the lines dash, a hatched band covers the stretch and the end
// dots are hollow.
export default function ChartLineForecastExample() {
  const { pct } = useFormat();
  return (
    <LineChartCard
      title="Growth against plan"
      description="Since May, month-end; November and December are a forecast"
      data={worth}
      xKey="month"
      series={series}
      today="Oct"
      forecastFrom="Oct"
      valueFormatter={pct}
      height={256}
    />
  );
}
