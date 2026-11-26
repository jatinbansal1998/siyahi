import { useState } from "react";
import { Button, TimeSeriesChartCard, type TimeSeriesChartPane, type TimeSeriesChartPoint } from "@siyahi/ui";

// One made-up reading a minute from 09:15 IST on 26 November 2026, as seconds since 1970. The feed dropped for ten
// minutes from 10:05, which the chart shows as a break in the line, not as a straight line across it.
const OPEN = Date.UTC(2026, 10, 26, 3, 45) / 1000;
const reading = (i: number): TimeSeriesChartPoint => ({
  time: OPEN + i * 60,
  value: i >= 50 && i < 60 ? null : 212 + Math.sin(i / 11) * 9 + Math.sin(i / 2.5) * 2,
});

export default function TimeSeriesChartLiveExample() {
  const [minutes, setMinutes] = useState(90);
  const panes: TimeSeriesChartPane[] = [
    {
      height: 220,
      series: [
        {
          label: "Response time, ms",
          color: "var(--chart-1)",
          data: Array.from({ length: minutes }, (_, i) => reading(i)),
        },
      ],
      levels: [{ value: 220, label: "limit" }],
    },
  ];
  return (
    <TimeSeriesChartCard
      title="Response time held under its limit after the feed came back"
      description="One reading a minute, in IST; the gap is ten minutes without a reading. A new reading joins the line where the reader left the view."
      action={
        <Button variant="outline" size="sm" onClick={() => setMinutes(minutes + 5)}>
          Add 5 minutes
        </Button>
      }
      panes={panes}
      credit={false}
    />
  );
}
