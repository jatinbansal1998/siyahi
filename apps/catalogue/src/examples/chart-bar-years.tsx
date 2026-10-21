import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Net realized gain per financial year (April to March); made-up figures.
const data = [
  { fy: "FY21", net: 42000 },
  { fy: "FY22", net: 186000 },
  { fy: "FY23", net: -64000 },
  { fy: "FY24", net: 128000 },
  { fy: "FY25", net: -21000 },
  { fy: "FY26", net: 73000 },
];

const series: ChartSeries<(typeof data)[number]> = [{ key: "net", label: "Net realized", color: "var(--chart-1)" }];

export default function ChartBarYearsExample() {
  const { money, moneyCompact } = useFormat();
  // The arrow carries the sign, so the figure never relies on colour alone.
  const signed = (v: number) => `${v < 0 ? "▼" : "▲"}${moneyCompact(Math.abs(v))}`;
  return (
    <BarChartCard
      title="Realized by financial year"
      description="April to March, gross"
      data={data}
      xKey="fy"
      xTickDetail={(row) => signed(row.net)}
      series={series}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={272}
    />
  );
}
