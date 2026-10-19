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

// One cell per day for the last 60 days: how many price fetches failed.
const data = Array.from({ length: 60 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 22 + i));
  return { date: day.toISOString().slice(0, 10), value: i % 17 === 5 ? 3 : i % 11 === 3 ? 1 : 0 };
});

export default function HeatmapStatusExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price feed</CardTitle>
        <CardDescription>Failed fetches per day</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <StatusHeatmap data={data}>
          <StatusHeatmapBody>
            {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} />}
          </StatusHeatmapBody>
        </StatusHeatmap>
      </CardContent>
    </Card>
  );
}
