import {
  BarChartCard,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricStrip,
  PanelGrid,
  SiyahiProvider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  useFormat,
  type MetricStripItem,
  type Surface,
} from "@siyahi/ui";
import { useState } from "react";

const orders = [
  { hour: 9, orders: 42 },
  { hour: 10, orders: 31 },
  { hour: 11, orders: 18 },
  { hour: 12, orders: 12 },
  { hour: 13, orders: 15 },
  { hour: 14, orders: 24 },
  { hour: 15, orders: 38 },
];

const products = [
  { product: "Dinner set", revenue: 276000 },
  { product: "Standing desk", revenue: 224400 },
  { product: "Bookshelf", revenue: 166000 },
];

function Dashboard() {
  const { money, moneyCompact, pct } = useFormat();
  const kpis: MetricStripItem[] = [
    { label: "Revenue", value: money(4512300), change: 0.031 },
    { label: "Target", value: moneyCompact(4025000), change: 85000, changeFormat: "money" },
    { label: "Gross margin", value: pct(0.142), change: -0.004 },
    { label: "Cash flow", value: moneyCompact(-61200), change: -61200, changeFormat: "money" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <MetricStrip items={kpis} />
      <PanelGrid>
        <BarChartCard
          title="Orders by hour"
          description="Today, IST"
          data={orders}
          xKey="hour"
          xFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`}
          series={[{ key: "orders", label: "Orders", color: "var(--chart-1)" }]}
          height={200}
        />
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Largest three by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((row) => (
                  <TableRow key={row.product}>
                    <TableCell>{row.product}</TableCell>
                    <TableCell>{money(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PanelGrid>
    </div>
  );
}

export default function SurfacesExample() {
  const [surface, setSurface] = useState<Surface>("open");
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        value={[surface]}
        onValueChange={([next]) => {
          // Pressing the selected surface again would leave none selected; keep it.
          if (next) setSurface(next as Surface);
        }}
        variant="outline"
        size="sm"
        aria-label="Surface"
      >
        {/* The default first. */}
        <ToggleGroupItem value="open">Open</ToggleGroupItem>
        <ToggleGroupItem value="card">Card</ToggleGroupItem>
      </ToggleGroup>
      {/* A nested provider sets the surface for its part of the page. */}
      <SiyahiProvider surface={surface}>
        <Dashboard />
      </SiyahiProvider>
    </div>
  );
}
