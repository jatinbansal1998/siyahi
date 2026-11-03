import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

// The biggest unrealised gains and losses; made-up figures.
const gains = [
  { name: "INFY", value: 84000 },
  { name: "TCS", value: 52000 },
  { name: "HDFCBANK", value: 31000 },
];
const losses = [
  { name: "ITC", value: 18400 },
  { name: "WIPRO", value: 7600 },
];

export default function BarListSidesExample() {
  const { money } = useFormat();
  // One scale for both lists, so a small loss draws a short bar beside a large gain.
  const max = Math.max(...[...gains, ...losses].map((row) => row.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle>What drives the P&L</CardTitle>
        <CardDescription>The biggest ₹ gains and losses, on one scale</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <BarList data={gains} max={max} color="var(--positive)" valueFormatter={(v) => money(v)} />
        <BarList data={losses} max={max} color="var(--negative)" valueFormatter={(v) => money(v)} />
      </CardContent>
    </Card>
  );
}
