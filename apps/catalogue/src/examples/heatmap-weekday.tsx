import { useState } from "react";
import {
  useFormat,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  WeekdayHeatmap,
  WeekdayHeatmapBlock,
  WeekdayHeatmapBody,
  WeekdayHeatmapLegend,
} from "@siyahi/ui";

// Orders placed by weekday and hour of the trading session.
const data = [1, 2, 3, 4, 5].flatMap((weekday) =>
  [9, 10, 11, 12, 13, 14, 15].map((hour) => ({
    weekday,
    hour,
    value: ((weekday * 5 + hour * 3) % 9) + (hour === 9 ? 6 : 0),
  })),
);
const busiest = data.reduce((top, cell) => (cell.value > top.value ? cell : top));
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export default function HeatmapWeekdayExample() {
  // The page owns the pick: a second tap on the same cell clears it.
  const [picked, setPicked] = useState<(typeof data)[number] | null>(null);
  const isPicked = (cell: { weekday: number; hour: number }) =>
    cell.weekday === picked?.weekday && cell.hour === picked.hour;
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>When orders are placed</CardTitle>
        <CardDescription>Weekday by hour in India Standard Time, market hours only</CardDescription>
      </CardHeader>
      {/* Seven hours by five days is a small grid: capped, it keeps square cells, and the legend and the answer
          sit beside it instead of a wide empty card. */}
      <CardContent>
        <WeekdayHeatmap data={data} hours={[9, 10, 11, 12, 13, 14, 15]} weekdays={[1, 2, 3, 4, 5]}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <WeekdayHeatmapBody className="lg:w-md lg:shrink-0">
              {({ activity }) => (
                <WeekdayHeatmapBlock
                  activity={activity}
                  selected={isPicked(activity)}
                  onCellClick={(cell) => setPicked(isPicked(cell) ? null : cell)}
                />
              )}
            </WeekdayHeatmapBody>
            <div className="flex flex-col items-start gap-3 text-sm">
              <WeekdayHeatmapLegend
                className="ml-0"
                labels={{ less: "0 orders", more: `${count(busiest.value)} orders an hour` }}
              />
              <p>
                Busiest: {DAYS[busiest.weekday]} at {hourLabel(busiest.hour)}, {count(busiest.value)} orders
              </p>
              <p aria-live="polite" className="text-muted-foreground">
                {picked
                  ? `${DAYS[picked.weekday]}, ${hourLabel(picked.hour)} IST: ${count(picked.value)} orders`
                  : "Select a cell for its order count. Use arrow keys to move between cells."}
              </p>
            </div>
          </div>
        </WeekdayHeatmap>
      </CardContent>
    </Card>
  );
}
