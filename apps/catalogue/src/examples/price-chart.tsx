import { Card, CardContent, CardDescription, CardHeader, CardTitle, PriceChart } from "@siyahi/ui";

// A made-up daily close series for one year.
const data = Array.from({ length: 250 }, (_, i) => {
  const day = new Date(Date.UTC(2025, 9, 20 + Math.floor((i * 7) / 5)));
  return { time: day.toISOString().slice(0, 10), value: 1500 + i * 1.2 + Math.sin(i / 9) * 60 + Math.sin(i / 3) * 18 };
});

export default function PriceChartExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>INFY</CardTitle>
        <CardDescription>Daily close, one year</CardDescription>
      </CardHeader>
      <CardContent>
        <PriceChart data={data} height={256} />
      </CardContent>
    </Card>
  );
}
