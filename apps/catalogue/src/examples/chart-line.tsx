import { useState } from "react";
import { LineChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

const cumulative = [
  { month: "May", store: 0.012, category: 0.008 },
  { month: "Jun", store: 0.021, category: 0.015 },
  { month: "Jul", store: 0.034, category: 0.029 },
  { month: "Aug", store: -0.006, category: 0.004 },
  { month: "Sep", store: 0.041, category: 0.031 },
  { month: "Oct", store: 0.052, category: 0.036 },
];

const monthly = [
  { month: "May", store: 0.012, category: 0.008 },
  { month: "Jun", store: 0.009, category: 0.007 },
  { month: "Jul", store: 0.013, category: 0.014 },
  { month: "Aug", store: -0.039, category: -0.024 },
  { month: "Sep", store: 0.047, category: 0.027 },
  { month: "Oct", store: 0.011, category: 0.005 },
];

const series: ChartSeries<(typeof cumulative)[number]> = [
  { key: "store", label: "Our store", color: "var(--chart-1)" },
  { key: "category", label: "Category average", color: "var(--chart-2)" },
];

export default function ChartLineExample() {
  const { pct } = useFormat();
  const [mode, setMode] = useState("cumulative");
  return (
    <LineChartCard
      title="Sales growth against the category"
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
          <ToggleGroupItem value="cumulative">Cumulative growth</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly growth</ToggleGroupItem>
        </ToggleGroup>
      }
      data={mode === "cumulative" ? cumulative : monthly}
      xKey="month"
      series={series}
      // A formatter goes in as it is: the card calls it with the value alone.
      valueFormatter={pct}
      height={256}
    />
  );
}
