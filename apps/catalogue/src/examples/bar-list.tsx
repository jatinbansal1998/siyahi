import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, Delta, useFormat } from "@siyahi/ui";

// value is the drop in a customer's monthly spend; detail is that drop as a share of last month's.
const largestDrops = [
  { name: "Sharma Textiles", value: 18400, detail: <Delta value={-0.062} /> },
  { name: "Bluepine Logistics", value: 12900, detail: <Delta value={-0.047} /> },
  { name: "Lakeview Clinics", value: 7600, detail: <Delta value={-0.072} /> },
  { name: "Coastal Foods (India)", value: 4100, detail: <Delta value={-0.06} /> },
];

export default function BarListExample() {
  const { money } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Customers whose spend fell most this month</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList data={largestDrops} valueFormatter={(v) => money(v)} showPercentage />
      </CardContent>
    </Card>
  );
}
