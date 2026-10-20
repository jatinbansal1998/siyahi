import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, Delta, useFormat } from "@siyahi/ui";

// detail is the loss as a share of what the holding cost.
const largestLosses = [
  { name: "ITC", value: 18400, detail: <Delta value={-0.062} /> },
  { name: "HDFCBANK", value: 12900, detail: <Delta value={-0.047} /> },
  { name: "WIPRO", value: 7600, detail: <Delta value={-0.072} /> },
  { name: "ASIANPAINT", value: 4100, detail: <Delta value={-0.06} /> },
];

export default function BarListExample() {
  const { money } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Largest unrealised losses</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList data={largestLosses} valueFormatter={(v) => money(v)} showPercentage />
      </CardContent>
    </Card>
  );
}
