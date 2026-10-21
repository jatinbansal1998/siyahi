import { useState } from "react";
import { BarChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Net realized gain per financial year (April to March); made-up figures.
const data = [
  { fy: "FY22", net: 142000 },
  { fy: "FY23", net: 186000 },
  { fy: "FY24", net: -164000 },
  { fy: "FY25", net: 128000 },
  { fy: "FY26", net: -121000 },
];

// A gain and a loss take the meaning colours; the arrow in each tick says the same without colour.
const series: ChartSeries<(typeof data)[number]> = [
  { key: "net", label: "Net realized", color: "var(--positive)", negativeColor: "var(--negative)" },
];

export default function ChartBarYearsExample() {
  const { money, moneyCompact } = useFormat();
  // The page owns the pick, so it can narrow the rest of the page to that year.
  const [year, setYear] = useState<string | null>(null);
  const signed = (v: number) => `${v < 0 ? "▼" : "▲"}${moneyCompact(Math.abs(v))}`;
  return (
    <BarChartCard
      title="Realized by financial year"
      description={
        year ? `${year} picked; click it again for every year` : "April to March, gross. Click a year to pick it."
      }
      data={data}
      xKey="fy"
      xTickDetail={(row) => signed(row.net)}
      selected={year}
      onSelect={setYear}
      series={series}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={272}
    />
  );
}
