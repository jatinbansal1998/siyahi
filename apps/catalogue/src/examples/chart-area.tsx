import { AreaChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

const data = [
  { month: "May", value: 3820000, invested: 3600000 },
  { month: "Jun", value: 3950000, invested: 3685000 },
  { month: "Jul", value: 4110000, invested: 3770000 },
  { month: "Aug", value: 4020000, invested: 3855000 },
  { month: "Sep", value: 4380000, invested: 3940000 },
  { month: "Oct", value: 4512300, invested: 4025000 },
];

// Drawn in this order, so value sits over the money put in.
const series: ChartSeries<(typeof data)[number]> = {
  invested: { label: "Invested", color: "var(--chart-2)" },
  value: { label: "Value", color: "var(--chart-1)" },
};

export default function ChartAreaExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <AreaChartCard
      title="Portfolio value"
      description="Month-end value against money put in"
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
