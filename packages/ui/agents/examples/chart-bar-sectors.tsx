import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Foreign investors' net buying by sector over a month, in ₹ crore as the source reports it; made-up figures.
const data = [
  { sector: "Financial services", net: 23_000 },
  { sector: "Oil, gas and fuels", net: 6_100 },
  { sector: "Healthcare", net: 1_800 },
  { sector: "Automobiles", net: -1_200 },
  { sector: "Information technology", net: -4_800 },
];
const CRORE = 10_000_000;

// Buying and selling are money moving, not a gain or a loss, so the bars take a chart colour.
const series: ChartSeries<(typeof data)[number]> = [{ key: "net", label: "Net buying", color: "var(--chart-1)" }];

export default function ChartBarSectorsExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <BarChartCard
      title="Foreign buying by sector"
      description="Net buying in the month; selling runs left of zero"
      horizontal
      data={data}
      xKey="sector"
      series={series}
      valueFormatter={(value) => money(value * CRORE)}
      // Each tick in the unit of the axis' largest, so the axis reads in crore throughout.
      yTickFormatter={(value, scale) => moneyCompact(value * CRORE, scale * CRORE)}
    />
  );
}
