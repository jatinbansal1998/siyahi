import {
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>When orders are placed</CardTitle>
        <CardDescription>Weekday by hour, market hours only</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <WeekdayHeatmap data={data}>
          <WeekdayHeatmapBody>{({ activity }) => <WeekdayHeatmapBlock activity={activity} />}</WeekdayHeatmapBody>
        </WeekdayHeatmap>
      </CardContent>
    </Card>
  );
}
