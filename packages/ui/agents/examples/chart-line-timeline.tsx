import { LineChartCard, type ChartSeries } from "@siyahi/ui";

// A sar sample every 10 minutes from 15:00; the numbers are made up for the catalogue.
const data = [
  { minute: 0, used: 4.1, anon: 2.9 },
  { minute: 10, used: 4.3, anon: 3.1 },
  { minute: 20, used: 4.6, anon: 3.4 },
  { minute: 30, used: 5.2, anon: 4.2 },
  { minute: 40, used: 7.8, anon: 7.1 },
  { minute: 50, used: 8.1, anon: 7.6 },
  { minute: 60, used: 6.2, anon: 5.3 },
  { minute: 70, used: 4.4, anon: 3.2 },
];

const series: ChartSeries<(typeof data)[number]> = [
  { key: "used", label: "Used", color: "var(--chart-1)" },
  { key: "anon", label: "Anon", color: "var(--chart-2)" },
];

const clock = (minute: number) => `${Math.floor(15 + minute / 60)}:${String(minute % 60).padStart(2, "0")}`;

export default function ChartLineTimelineExample() {
  return (
    <LineChartCard
      title="Memory in use, GiB"
      description="sar -r. Used excludes cache; anon is program memory."
      data={data}
      xKey="minute"
      // Ticks on both ends of the domain: the first sits at the plot's left edge.
      xDomain={[0, 70]}
      xTicks={[0, 10, 20, 30, 40, 50, 60, 70]}
      xFormatter={clock}
      xTooltipFormatter={(minute) => `${clock(minute)} IST, 10-min average`}
      series={series}
      valueFormatter={(v) => v.toFixed(1)}
      yTickFormatter={(v) => v.toFixed(0)}
      curve="linear"
      height={192}
    />
  );
}
