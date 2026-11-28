import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Treemap,
  TreemapLegend,
  useFormat,
} from "@siyahi/ui";

// weight is a café chain's monthly spend on each line, in rupees, and change its rise on last month; made-up figures.
const costs = [
  { name: "Rent", group: "Premises", weight: 420000, change: 0 },
  { name: "Power", group: "Premises", weight: 96000, change: 0.18 },
  { name: "Wages", group: "People", weight: 610000, change: 0.04 },
  { name: "Training", group: "People", weight: 42000, change: -0.22 },
  { name: "Coffee beans", group: "Stock", weight: 236000, change: 0.31 },
  { name: "Milk", group: "Stock", weight: 148000, change: -0.07 },
  { name: "Packaging", group: "Stock", weight: 64000, change: -0.12 },
];

const [steepest] = costs.toSorted((a, b) => b.change - a.change);

export default function TreemapCostsExample() {
  const { pct } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {steepest?.name} cost {pct(steepest?.change ?? 0, 0)} more than last month
        </CardTitle>
        <CardDescription>
          Area is each line's spend this month; colour is its change on last month, deepest at ±40%. A rise in cost is
          bad news, so it is red.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Treemap items={costs} height={240} range={0.4} rise="bad" />
        <TreemapLegend range={0.4} rise="bad" className="mt-3 ml-auto" />
      </CardContent>
    </Card>
  );
}
