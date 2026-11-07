import { useState } from "react";
import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
  CalendarHeatmapFooter,
  CalendarHeatmapLegend,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useFormat,
} from "@siyahi/ui";

// A café's profit or loss each day for six months: weekends earn most, rainy Mondays lose; made-up figures.
const data = Array.from({ length: 182 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 4, 1 + i));
  const weekday = day.getUTCDay();
  const base = weekday === 0 || weekday === 6 ? 9000 : weekday === 1 ? -2500 : 3000;
  const swing = ((i * 37) % 23) * 400 - 4400;
  return { date: day.toISOString().slice(0, 10), value: base + swing };
});

export default function HeatmapCalendarSignedExample() {
  const [picked, setPicked] = useState<(typeof data)[number] | null>(null);
  const { money } = useFormat();
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by day</CardTitle>
        <CardDescription>May to October. Green days made money and red days lost it; deeper is more.</CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap
          data={data}
          signed
          weekStart={1}
          labels={{ heatmapLabel: "Profit by day, May to October", cellLabel: "{{date}}: {{value}} rupees" }}
        >
          <CalendarHeatmapBody>
            {({ activity, dayIndex, weekIndex }) => (
              <CalendarHeatmapBlock
                activity={activity}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                selected={activity.date === picked?.date}
                onCellClick={(cell) => setPicked(cell.date === picked?.date ? null : cell)}
              />
            )}
          </CalendarHeatmapBody>
          <CalendarHeatmapFooter className="whitespace-normal">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p aria-live="polite" className="text-sm tabular-nums">
                {picked ? `${picked.date}: ${signed(picked.value)}` : "Select a day for its profit or loss."}
              </p>
              <CalendarHeatmapLegend labels={{ less: "Loss", more: "Profit" }} />
            </div>
          </CalendarHeatmapFooter>
        </CalendarHeatmap>
      </CardContent>
    </Card>
  );
}
