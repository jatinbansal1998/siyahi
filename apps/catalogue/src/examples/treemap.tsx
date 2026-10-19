import { Card, CardContent, CardDescription, CardHeader, CardTitle, Treemap } from "@siyahi/ui";

const holdings = [
  { name: "ITC", weight: 276000, change: -0.012 },
  { name: "HDFCBANK", weight: 262500, change: -0.006 },
  { name: "ICICIBANK", weight: 258000, change: 0.022 },
  { name: "NIFTYBEES", weight: 255600, change: 0.009 },
  { name: "INFY", weight: 224400, change: 0.018 },
  { name: "TCS", weight: 166000, change: 0.004 },
  { name: "WIPRO", weight: 98000, change: -0.034 },
  { name: "SBIN", weight: 87000, change: 0.061 },
  { name: "ASIANPAINT", weight: 64000, change: -0.052 },
  { name: "LT", weight: 52000, change: 0 },
];

export default function TreemapExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings today</CardTitle>
        <CardDescription>Area is the holding's value; colour is the day's change</CardDescription>
      </CardHeader>
      <CardContent>
        <Treemap items={holdings} height={320} />
      </CardContent>
    </Card>
  );
}
