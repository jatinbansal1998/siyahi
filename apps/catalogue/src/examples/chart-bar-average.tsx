import { BarChartCard, type ChartSeries } from "@siyahi/ui";

// A shop's orders each month, online and in store, with each one's 3-month average as the page's data source works it
// out: the mean of the month and the two before it, so the first two months have none. Made-up figures.
const data = [
  { month: "Jan", online: 420, store: 300, onlineAvg: null, storeAvg: null },
  { month: "Feb", online: 510, store: 280, onlineAvg: null, storeAvg: null },
  { month: "Mar", online: 380, store: 340, onlineAvg: 437, storeAvg: 307 },
  { month: "Apr", online: 560, store: 260, onlineAvg: 483, storeAvg: 293 },
  { month: "May", online: 610, store: 310, onlineAvg: 517, storeAvg: 303 },
  { month: "Jun", online: 470, store: 290, onlineAvg: 547, storeAvg: 287 },
  { month: "Jul", online: 690, store: 330, onlineAvg: 590, storeAvg: 310 },
  { month: "Aug", online: 720, store: 270, onlineAvg: 627, storeAvg: 297 },
  { month: "Sep", online: 580, store: 350, onlineAvg: 663, storeAvg: 317 },
  { month: "Oct", online: 760, store: 300, onlineAvg: 687, storeAvg: 307 },
  { month: "Nov", online: 810, store: 280, onlineAvg: 717, storeAvg: 310 },
  { month: "Dec", online: 700, store: 320, onlineAvg: 757, storeAvg: 300 },
];

const series: ChartSeries<(typeof data)[number]> = [
  { key: "online", label: "Online", color: "var(--chart-1)" },
  { key: "store", label: "In store", color: "var(--chart-2)" },
];

// Each average takes its bars' colour, so a line reads as the trend of the bars under it.
const lines: ChartSeries<(typeof data)[number]> = [
  { key: "onlineAvg", label: "Online, 3-month average", color: "var(--chart-1)" },
  { key: "storeAvg", label: "In store, 3-month average", color: "var(--chart-2)" },
];

export default function ChartBarAverageExample() {
  return (
    <BarChartCard
      title="Orders by month, with the trend"
      description="Bars are each month's orders; lines are their 3-month averages"
      data={data}
      xKey="month"
      series={series}
      lines={lines}
      height={256}
    />
  );
}
