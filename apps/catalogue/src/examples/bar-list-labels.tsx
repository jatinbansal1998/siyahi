import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

const categories = [
  { name: "Home Appliances and Kitchen Equipment", value: 100 },
  { name: "Health, Beauty and Personal Care", value: 70 },
  { name: "Books, Stationery and Office Supplies", value: 50 },
];

export default function BarListLabelsExample() {
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by category, ranked</CardTitle>
        <CardDescription>Orders placed this month in each category</CardDescription>
      </CardHeader>
      <CardContent>
        <BarList data={categories} valueFormatter={count} />
      </CardContent>
    </Card>
  );
}
