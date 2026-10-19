import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

const largestLosses = [
  { name: "ITC", value: 18400 },
  { name: "HDFCBANK", value: 12900 },
  { name: "WIPRO", value: 7600 },
  { name: "ASIANPAINT", value: 4100 },
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
