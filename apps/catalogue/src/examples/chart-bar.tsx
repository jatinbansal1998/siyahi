import { useState } from "react";
import { BarChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

const data = [
  { quarter: "Q1", online: 120000, retail: 40000, wholesale: 15000, marketplace: 9000, events: 4000 },
  { quarter: "Q2", online: 95000, retail: 52000, wholesale: 20000, marketplace: 6000, events: 3000 },
  { quarter: "Q3", online: 140000, retail: 38000, wholesale: 12000, marketplace: 11000, events: 5000 },
  { quarter: "Q4", online: 160000, retail: 45000, wholesale: 25000, marketplace: 7000, events: 2000 },
];

// Series take the slots in order: neighbours differ in lightness, slots two
// apart differ in hue.
const series: ChartSeries<(typeof data)[number]> = [
  { key: "online", label: "Online", color: "var(--chart-1)" },
  { key: "retail", label: "Retail", color: "var(--chart-2)" },
  { key: "wholesale", label: "Wholesale", color: "var(--chart-3)" },
  { key: "marketplace", label: "Marketplace", color: "var(--chart-4)" },
  { key: "events", label: "Events", color: "var(--chart-5)" },
];

export default function ChartBarExample() {
  const { money, moneyCompact } = useFormat();
  const [layout, setLayout] = useState("grouped");
  return (
    <BarChartCard
      title="Revenue by channel and quarter"
      description={
        layout === "grouped"
          ? "All five chart colours side by side, in series order"
          : "All five chart colours stacked into the quarter's total"
      }
      action={
        <ToggleGroup
          value={[layout]}
          onValueChange={([next]) => {
            // Pressing the selected layout again would leave none selected; keep it.
            if (next) setLayout(next);
          }}
          variant="outline"
          size="sm"
          aria-label="Layout"
        >
          <ToggleGroupItem value="grouped">Grouped</ToggleGroupItem>
          <ToggleGroupItem value="stacked">Stacked</ToggleGroupItem>
        </ToggleGroup>
      }
      data={data}
      xKey="quarter"
      series={series}
      stacked={layout === "stacked"}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={256}
    />
  );
}
