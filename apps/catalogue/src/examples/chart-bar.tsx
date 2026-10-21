import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

const data = [
  { quarter: "Q1", equity: 120000, debt: 40000, gold: 15000, cash: 9000, reits: 4000 },
  { quarter: "Q2", equity: 95000, debt: 52000, gold: 20000, cash: 6000, reits: 3000 },
  { quarter: "Q3", equity: 140000, debt: 38000, gold: 12000, cash: 11000, reits: 5000 },
  { quarter: "Q4", equity: 160000, debt: 45000, gold: 25000, cash: 7000, reits: 2000 },
];

// Series take the slots in order: neighbours differ in lightness, slots two
// apart differ in hue.
const series: ChartSeries<(typeof data)[number]> = [
  { key: "equity", label: "Equity", color: "var(--chart-1)" },
  { key: "debt", label: "Debt", color: "var(--chart-2)" },
  { key: "gold", label: "Gold", color: "var(--chart-3)" },
  { key: "cash", label: "Cash", color: "var(--chart-4)" },
  { key: "reits", label: "REITs", color: "var(--chart-5)" },
];

export default function ChartBarExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <BarChartCard
      title="Money invested by quarter"
      description="All five chart colours, stacked in series order"
      data={data}
      xKey="quarter"
      series={series}
      stacked
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={256}
    />
  );
}
