import { useState } from "react";
import { LineChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

const cumulative = [
  { month: "May", portfolio: 0.012, index: 0.008 },
  { month: "Jun", portfolio: 0.021, index: 0.015 },
  { month: "Jul", portfolio: 0.034, index: 0.029 },
  { month: "Aug", portfolio: -0.006, index: 0.004 },
  { month: "Sep", portfolio: 0.041, index: 0.031 },
  { month: "Oct", portfolio: 0.052, index: 0.036 },
];

const monthly = [
  { month: "May", portfolio: 0.012, index: 0.008 },
  { month: "Jun", portfolio: 0.009, index: 0.007 },
  { month: "Jul", portfolio: 0.013, index: 0.014 },
  { month: "Aug", portfolio: -0.039, index: -0.024 },
  { month: "Sep", portfolio: 0.047, index: 0.027 },
  { month: "Oct", portfolio: 0.011, index: 0.005 },
];

const series: ChartSeries<(typeof cumulative)[number]> = [
  { key: "portfolio", label: "Portfolio", color: "var(--chart-1)" },
  { key: "index", label: "Nifty 50", color: "var(--chart-2)" },
];

export default function ChartLineExample() {
  const { pct } = useFormat();
  const [mode, setMode] = useState("cumulative");
  return (
    <LineChartCard
      title="Return against the index"
      description={mode === "cumulative" ? "Cumulative, from the start of May" : "Each month on its own"}
      action={
        <ToggleGroup
          value={[mode]}
          onValueChange={([next]) => {
            // Pressing the selected mode again would leave none selected; keep it.
            if (next) setMode(next);
          }}
          variant="outline"
          size="sm"
          aria-label="Mode"
        >
          <ToggleGroupItem value="cumulative">Cumulative return</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly return</ToggleGroupItem>
        </ToggleGroup>
      }
      data={mode === "cumulative" ? cumulative : monthly}
      xKey="month"
      series={series}
      valueFormatter={(v) => pct(v)}
      yTickFormatter={(v) => pct(v, 0)}
      height={256}
    />
  );
}
