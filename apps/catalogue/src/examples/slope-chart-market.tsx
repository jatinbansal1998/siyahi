import { Card, CardContent, CardDescription, CardHeader, CardTitle, SlopeChart, type SlopeItem } from "@siyahi/ui";

// Each aisle's share of one grocery store's sales against its share across the region's stores; made-up figures.
const items: SlopeItem[] = [
  { name: "Fresh fruit and vegetables", from: 0.18, to: 0.24 },
  { name: "Dairy and eggs", from: 0.14, to: 0.15 },
  { name: "Bakery", from: 0.07, to: 0.11 },
  { name: "Rice, flour and pulses", from: 0.16, to: 0.12 },
  { name: "Snacks and drinks", from: 0.15, to: 0.13 },
  { name: "Household and cleaning", from: 0.11, to: 0.08 },
  { name: "Personal care", from: 0.09, to: 0.08 },
  { name: "Frozen food", from: 0.06, to: 0.05 },
  { name: "Baby care", from: 0.04, to: 0.04 },
];

// The aisles at least three points away from the region, either way.
const apart = items.filter(({ from, to }) => Math.abs(to - from) >= 0.03).map(({ name }) => name);

export default function SlopeChartMarketExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our aisles against the region</CardTitle>
        <CardDescription>
          Share of sales by aisle. Aisles three points or more away from the region are drawn in colour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SlopeChart items={items} fromLabel="Region" toLabel="This store, this year" highlighted={apart} />
      </CardContent>
    </Card>
  );
}
