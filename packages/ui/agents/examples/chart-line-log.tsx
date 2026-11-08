import { Badge, LineChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Monthly active users in the app's first year, made up for the catalogue: from a few hundred to tens of thousands.
const data = [
  { month: "Nov", users: 240 },
  { month: "Dec", users: 410 },
  { month: "Jan", users: 780 },
  { month: "Feb", users: 1350 },
  { month: "Mar", users: 2100 },
  { month: "Apr", users: 3900 },
  { month: "May", users: 6200 },
  { month: "Jun", users: 9800 },
  { month: "Jul", users: 14100 },
  { month: "Aug", users: 21500 },
  { month: "Sep", users: 30200 },
  { month: "Oct", users: 46800 },
];

const series: ChartSeries<(typeof data)[number]> = [{ key: "users", label: "Active users", color: "var(--chart-1)" }];

export default function ChartLineLogExample() {
  const { count } = useFormat();
  return (
    <LineChartCard
      title="Active users grew about 1.5× a month all year"
      description="On log, steady growth is a straight line; Linear shows how much of it came in the last few months."
      action={<Badge variant="outline">First year</Badge>}
      data={data}
      xKey="month"
      series={series}
      // Log is selected first; the buttons in the header let the reader switch.
      yScale="log"
      yScaleToggle
      yLabel="Active users"
      valueFormatter={count}
      height={256}
    />
  );
}
