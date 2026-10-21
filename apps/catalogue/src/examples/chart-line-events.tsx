import { LineChartCard, type ChartSeries } from "@siyahi/ui";

// A sample every 15 s from 19:33:58; the numbers are made up for the catalogue.
const START = (19 * 60 + 33) * 60 + 58;
const PRESSURE = [
  4, 18, 41, 58, 63, 66, 61, 70, 72, 68, 64, 71, 74, 69, 66, 62, 67, 73, 70, 65, 68, 71, 66, 63, 69, 72,
];
const data = PRESSURE.map((pressure, i) => ({ second: i * 15, pressure }));

const series: ChartSeries<(typeof data)[number]> = [
  { key: "pressure", label: "Full pressure", color: "var(--chart-1)" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function clock(second: number) {
  const t = START + second;
  return `${Math.floor(t / 3600)}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
}

export default function ChartLineEventsExample() {
  return (
    <LineChartCard
      title="Memory pressure of a test group, %"
      description="avg10, sampled every 15 s"
      data={data}
      xKey="second"
      // A numeric axis: ticks fall on whole minutes, 2 s after the first sample.
      xDomain={[0, 390]}
      xTicks={[2, 62, 122, 182, 242, 302, 362]}
      xFormatter={(second) => clock(second).slice(0, 5)}
      xTooltipFormatter={(second) => `${clock(second)} IST, 10 s average`}
      series={series}
      curve="linear"
      valueFormatter={(v) => `${v}%`}
      yDomain={[0, 100]}
      yTicks={[0, 25, 50, 75, 100]}
      referenceLines={[
        { y: 80, label: "old limit, 80%" },
        { y: 50, label: "new limit, 50%", emphasis: "strong" },
        { x: 313, label: "limit 50%", labelPosition: "insideBottomLeft" },
        { x: 367, label: "killed", emphasis: "strong", labelPosition: "insideTopRight" },
      ]}
      height={224}
    />
  );
}
