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

// A gain and a loss take the meaning colours; the arrow in each tick says the same without colour.
const series: ChartSeries<(typeof data)[number]> = [
  { key: "net", label: "Net realized", color: "var(--positive)", negativeColor: "var(--negative)" },
];

export default function ChartBarYearsExample() {
  const { money, moneyCompact } = useFormat();
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
