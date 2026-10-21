import { useState } from "react";
import { BarChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

// Share of equity by sector against an index's weights; made-up figures.
const WEIGHTS = {
  "Nifty 50": [
    { sector: "Financial Services", you: 0.34, index: 0.37 },
    { sector: "Information Technology", you: 0.21, index: 0.13 },
    { sector: "Oil, Gas & Consumable Fuels", you: 0.06, index: 0.1 },
    { sector: "Fast Moving Consumer Goods", you: 0.12, index: 0.08 },
    { sector: "Automobile and Auto Components", you: 0.09, index: 0.07 },
    { sector: "Healthcare", you: 0.08, index: 0.04 },
  ],
  "Nifty 500": [
    { sector: "Financial Services", you: 0.34, index: 0.31 },
    { sector: "Information Technology", you: 0.21, index: 0.1 },
    { sector: "Oil, Gas & Consumable Fuels", you: 0.06, index: 0.08 },
    { sector: "Fast Moving Consumer Goods", you: 0.12, index: 0.07 },
    { sector: "Automobile and Auto Components", you: 0.09, index: 0.07 },
    { sector: "Healthcare", you: 0.08, index: 0.06 },
  ],
};
type Index = keyof typeof WEIGHTS;
type Row = (typeof WEIGHTS)[Index][number];

export default function ChartBarSectorsExample() {
  const { pct } = useFormat();
  const [index, setIndex] = useState<Index>("Nifty 50");
  const rows = WEIGHTS[index];
  const series: ChartSeries<Row> = [
    { key: "you", label: "You", color: "var(--chart-1)" },
    { key: "index", label: index, color: "var(--chart-2)" },
  ];
  const gap = (row: Row) => {
    const points = Math.abs(row.you - row.index) * 100;
    return row.you >= row.index ? `▲${points.toFixed(1)} pts over` : `▼${points.toFixed(1)} pts under`;
  };
  return (
    <BarChartCard
      title="Sectors against the index"
      description="Share of your equity and of the index, by sector"
      action={
        <ToggleGroup
          value={[index]}
          onValueChange={([next]) => {
            // Pressing the selected index again would leave none selected; keep it.
            if (next) setIndex(next as Index);
          }}
          variant="outline"
          size="sm"
          aria-label="Index"
        >
          <ToggleGroupItem value="Nifty 50">Nifty 50</ToggleGroupItem>
          <ToggleGroupItem value="Nifty 500">Nifty 500</ToggleGroupItem>
        </ToggleGroup>
      }
      horizontal
      data={rows}
      xKey="sector"
      xTickDetail={(row) => `${pct(row.you)} vs ${pct(row.index)} · ${gap(row)}`}
      series={series}
      valueFormatter={(v) => pct(v)}
      height={rows.length * 56 + 48}
      footer={<p className="text-muted-foreground">Company shares only; ETFs and funds are left out.</p>}
    />
  );
}
