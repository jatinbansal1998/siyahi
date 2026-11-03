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
} from "@siyahi/ui";

// Orders placed by weekday and hour of the trading session.
const data = [1, 2, 3, 4, 5].flatMap((weekday) =>
  [9, 10, 11, 12, 13, 14, 15].map((hour) => ({
    weekday,
    hour,
    value: ((weekday * 5 + hour * 3) % 9) + (hour === 9 ? 6 : 0),
  })),
);

export default function HeatmapWeekdayExample() {
  const [selected, setSelected] = useState<string | null>(null);
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>When orders are placed</CardTitle>
        <CardDescription>Weekday by hour in India Standard Time, market hours only</CardDescription>
      </CardHeader>
      <CardContent>
        <WeekdayHeatmap data={data} hours={[9, 10, 11, 12, 13, 14, 15]} weekdays={[1, 2, 3, 4, 5]}>
          <WeekdayHeatmapBody>
            {({ activity }) => (
              <WeekdayHeatmapBlock
                activity={activity}
                onCellClick={(cell) =>
                  setSelected(
                    `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][cell.weekday]}, ${String(cell.hour).padStart(2, "0")}:00 IST: ${count(cell.value)} orders`,
                  )
                }
              />
            )}
          </WeekdayHeatmapBody>
        </WeekdayHeatmap>
        <p aria-live="polite" className="mt-3 text-sm">
          {selected ?? "Select a cell for its order count. Use arrow keys to move between cells."}
        </p>
      </CardContent>
    </Card>
  );
}
