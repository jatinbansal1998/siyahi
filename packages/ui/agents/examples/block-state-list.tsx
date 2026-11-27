import { BarList, BlockState, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

// No customer's spend fell this month, so the list has nothing to rank.
const largestDrops: { name: string; value: number }[] = [];

export default function BlockStateListExample() {
  const { money } = useFormat();
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Customers whose spend fell most this month</CardDescription>
      </CardHeader>
      <CardContent>
        {largestDrops.length ? (
          <BarList data={largestDrops} valueFormatter={(v) => money(v)} />
        ) : (
          <BlockState
            title="No customer spent less this month"
            description="Every customer spent as much as last month or more."
          />
        )}
      </CardContent>
    </Card>
  );
}
