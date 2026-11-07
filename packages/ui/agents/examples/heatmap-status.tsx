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
// 3 healthy (quiet grey), 2 degraded (a half bar in --warning), 1 critical (a full bar in --destructive),
// 0 no data (a hollow outline).
const data = Array.from({ length: 60 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 22 + i));
  // Two days in September the monitor itself was down, so there is no reading: 0.
  const value = i === 30 || i === 31 ? 0 : i % 17 === 5 ? 1 : i % 11 === 3 ? 2 : 3;
  return { date: day.toISOString().slice(0, 10), value };
});

export default function HeatmapStatusExample() {
  // The page owns the pick: a second tap on the same day clears it.
  const [picked, setPicked] = useState<(typeof data)[number] | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout API</CardTitle>
        <CardDescription>Daily health: healthy, degraded or critical</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusHeatmap data={data} statusValues={[3, 2, 1, 0]}>
          <StatusHeatmapBody>
            {({ activity, dayIndex }) => (
              <StatusHeatmapBlock
                activity={activity}
                dayIndex={dayIndex}
                selected={activity.date === picked?.date}
                onCellClick={(cell) => setPicked(cell.date === picked?.date ? null : cell)}
              />
            )}
          </StatusHeatmapBody>
          <StatusHeatmapFooter className="whitespace-normal">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p aria-live="polite" className="text-sm">
                {picked
                  ? `${picked.date}: ${["unknown", "critical", "degraded", "healthy"][picked.value] ?? "unknown"}`
                  : "Select a day for its health. Use arrow keys to move between days."}
              </p>
              <StatusHeatmapLegend />
            </div>
          </StatusHeatmapFooter>
        </StatusHeatmap>
      </CardContent>
    </Card>
  );
}
