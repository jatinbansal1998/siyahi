import { useState } from "react";
import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
  CalendarHeatmapFooter,
  CalendarHeatmapLegend,
  useFormat,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siyahi/ui";

// A year of trading days with a count of trades on each.
const data = Array.from({ length: 365 }, (_, i) => {
  const day = new Date(Date.UTC(2025, 9, 20 + i));
  const weekday = day.getUTCDay();
  const value = weekday === 0 || weekday === 6 ? 0 : (i * 7 + weekday * 3) % 6;
  return { date: day.toISOString().slice(0, 10), value };
});
const busiest = Math.max(...data.map((day) => day.value));

export default function HeatmapCalendarExample() {
  const [selected, setSelected] = useState<string | null>(null);
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades per day</CardTitle>
        <CardDescription>The last 12 months; counts use a single-hue fade of --chart-1</CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap data={data} labels={{ heatmapLabel: "Trades per day over the last 12 months" }}>
          <CalendarHeatmapBody>
            {({ activity, dayIndex, weekIndex }) => (
              <CalendarHeatmapBlock
                activity={activity}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                onCellClick={(cell) => setSelected(`${cell.date}: ${count(cell.value)} trades`)}
              />
            )}
          </CalendarHeatmapBody>
          <CalendarHeatmapFooter className="items-center justify-between gap-x-6 gap-y-2 whitespace-normal">
            <p aria-live="polite" className="text-sm">
              {selected ?? "Select a day for its trade count. Use arrow keys to move between days."}
            </p>
            <CalendarHeatmapLegend labels={{ less: "0 trades", more: `${count(busiest)} trades` }} />
          </CalendarHeatmapFooter>
        </CalendarHeatmap>
      </CardContent>
    </Card>
  );
}
