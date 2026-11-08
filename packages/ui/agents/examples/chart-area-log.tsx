import { AreaChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

// Money a new fund manages, month by month from launch, made up for the catalogue: ₹2L to ₹3.1Cr.
const data = [
  { month: "Nov", managed: 200000 },
  { month: "Dec", managed: 450000 },
  { month: "Jan", managed: 900000 },
  { month: "Feb", managed: 1600000 },
  { month: "Mar", managed: 2400000 },
  { month: "Apr", managed: 3900000 },
  { month: "May", managed: 5800000 },
  { month: "Jun", managed: 8200000 },
  { month: "Jul", managed: 12500000 },
  { month: "Aug", managed: 17000000 },
  { month: "Sep", managed: 23500000 },
  { month: "Oct", managed: 31000000 },
];

const series: ChartSeries<(typeof data)[number]> = [
  { key: "managed", label: "Money managed", color: "var(--chart-1)" },
];

export default function ChartAreaLogExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <AreaChartCard
      title="₹3.1Cr managed a year after launch"
      description="Linear shows the size today; Log shows the early months, when it grew fastest."
      action={
        <ToggleGroup defaultValue={["1Y"]} variant="outline" size="sm" aria-label="Range">
          <ToggleGroupItem value="6M">6M</ToggleGroupItem>
          <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
        </ToggleGroup>
      }
      data={data}
      xKey="month"
      series={series}
      // Linear is selected first; the buttons after the range toggle let the reader switch to log.
      yScaleToggle
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={256}
    />
  );
}
