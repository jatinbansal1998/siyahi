import { useState } from "react";
import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
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

export default function HeatmapCalendarExample() {
  const [selected, setSelected] = useState<string | null>(null);
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades per day</CardTitle>
        <CardDescription>Counts use a single-hue fade of --chart-1</CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap data={data}>
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
        </CalendarHeatmap>
        <p aria-live="polite" className="mt-3 text-sm">
          {selected ?? "Select a day for its trade count. Use arrow keys to move between days."}
        </p>
      </CardContent>
    </Card>
  );
}
