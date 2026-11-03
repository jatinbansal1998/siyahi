import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

const sectors = [
  { name: "Information Technology and Services", value: 100 },
  { name: "Fast Moving Consumer Goods", value: 70 },
  { name: "Automobile and Auto Components", value: 50 },
];

export default function BarListLabelsExample() {
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by sector, ranked</CardTitle>
        <CardDescription>Full labels and order counts stay readable in narrow panels</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList data={sectors} valueFormatter={count} />
      </CardContent>
    </Card>
  );
}
