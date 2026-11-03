import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// F&O net realized per financial year, a loss every year; made-up figures.
const data = [
  { fy: "FY23", net: -48000 },
  { fy: "FY24", net: -91000 },
  { fy: "FY25", net: -27000 },
  { fy: "FY26", net: -63000 },
];

const series: ChartSeries<(typeof data)[number]> = [
  { key: "net", label: "F&O net realized", color: "var(--positive)", negativeColor: "var(--negative)" },
];

export default function ChartBarLossesExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <BarChartCard
      title="F&O realized by financial year"
      description="A loss every year, so every bar runs down from zero"
      data={data}
      xKey="fy"
      series={series}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={240}
    />
  );
}
