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
  StatusHeatmapFooter,
  StatusHeatmapLegend,
} from "@siyahi/ui";

// One cell per day for the last 60 days, as a status the heatmap colours:
// 3 healthy (quiet grey), 2 degraded (--warning), 1 critical (--destructive).
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
        <StatusHeatmap data={data} statusValues={[3, 2, 1]}>
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
          <StatusHeatmapFooter className="items-center justify-between gap-x-6 gap-y-2 whitespace-normal">
            <p aria-live="polite" className="text-sm">
              {selected ?? "Select a day for its health. Use arrow keys to move between days."}
            </p>
            {/* No day lacks data, so the legend leaves out "No Data". */}
            <StatusHeatmapLegend className="gap-3" />
          </StatusHeatmapFooter>
        </StatusHeatmap>
      </CardContent>
    </Card>
  );
}
