import { Card, CardContent, CardDescription, CardHeader, CardTitle, SlopeChart, type SlopeItem } from "@siyahi/ui";

// Each channel's share of a bookshop's sales, last year and this; made-up figures.
const items: SlopeItem[] = [
  { name: "In store", from: 0.46, to: 0.38 },
  { name: "Own website", from: 0.18, to: 0.27 },
  { name: "Marketplaces", from: 0.21, to: 0.2 },
  { name: "Schools and libraries", from: 0.09, to: 0.1 },
  { name: "Events and fairs", from: 0.06, to: 0.05 },
];

export default function SlopeChartExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by channel</CardTitle>
        <CardDescription>
          Each channel's share of the year's sales. The website gained what the shop lost.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SlopeChart items={items} fromLabel="2025" toLabel="2026" highlighted={["In store", "Own website"]} />
      </CardContent>
    </Card>
  );
}
