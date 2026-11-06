import { AreaChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

const data = [
  { month: "May", revenue: 3820000, target: 3600000 },
  { month: "Jun", revenue: 3950000, target: 3685000 },
  { month: "Jul", revenue: 4110000, target: 3770000 },
  { month: "Aug", revenue: 4020000, target: 3855000 },
  { month: "Sep", revenue: 4380000, target: 3940000 },
  { month: "Oct", revenue: 4512300, target: 4025000 },
];

// The title states the finding, not the measure: what the reader would say after looking.
// The first series fills; the target draws as a line over it.
const series: ChartSeries<(typeof data)[number]> = [
  { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
  { key: "target", label: "Target", color: "var(--chart-2)" },
];

export default function ChartAreaExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <AreaChartCard
      title="October revenue ₹4.9L ahead of target"
      description="Each month's revenue against its target"
      action={
        <ToggleGroup defaultValue={["6M"]} variant="outline" size="sm" aria-label="Range">
          <ToggleGroupItem value="6M">6M</ToggleGroupItem>
          <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
        </ToggleGroup>
      }
      data={data}
      xKey="month"
      series={series}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={256}
    />
  );
}
