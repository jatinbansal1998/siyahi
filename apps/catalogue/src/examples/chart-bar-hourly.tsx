import { BarChartCard } from "@siyahi/ui";

// Market hours in IST; each row is the hour an order was placed in.
const data = [
  { hour: 9, orders: 42 },
  { hour: 10, orders: 31 },
  { hour: 11, orders: 18 },
  { hour: 12, orders: 12 },
  { hour: 13, orders: 15 },
  { hour: 14, orders: 24 },
  { hour: 15, orders: 38 },
];

export default function ChartBarHourlyExample() {
  return (
    <BarChartCard
      title="Orders by hour"
      description="Last 30 days, by the hour each order was placed"
      data={data}
      xKey="hour"
      xFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`}
      series={{ orders: { label: "Orders", color: "var(--chart-1)" } }}
      height={256}
    />
  );
}
