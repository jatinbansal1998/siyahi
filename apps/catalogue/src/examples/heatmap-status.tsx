import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
} from "@siyahi/ui";

// One cell per day for the last 60 days, as a status the heatmap colours:
// 3 healthy (--positive), 2 degraded (--warning), 1 critical (--negative).
const data = Array.from({ length: 60 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 22 + i));
  return { date: day.toISOString().slice(0, 10), value: i % 17 === 5 ? 1 : i % 11 === 3 ? 2 : 3 };
});

export default function HeatmapStatusExample() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price feed</CardTitle>
        <CardDescription>Daily health: healthy, degraded or critical</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusHeatmap data={data}>
          <StatusHeatmapBody>
            {({ activity, dayIndex }) => (
              <StatusHeatmapBlock
                activity={activity}
                dayIndex={dayIndex}
                onCellClick={(cell) =>
                  setSelected(
                    `${cell.date}: ${["unknown", "critical", "degraded", "healthy"][cell.value] ?? "unknown"}`,
                  )
                }
              />
            )}
          </StatusHeatmapBody>
        </StatusHeatmap>
        <p aria-live="polite" className="mt-3 text-sm">
          {selected ?? "Select a day for its health. Use arrow keys to move between days."}
        </p>
      </CardContent>
    </Card>
  );
}
