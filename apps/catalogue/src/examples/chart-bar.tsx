import {
  Bar,
  BarChart,
  CartesianGrid,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
  useFormat,
  type ChartConfig,
} from "@siyahi/ui";

const data = [
  { quarter: "Q1", equity: 120000, debt: 40000, gold: 15000, cash: 9000, reits: 4000 },
  { quarter: "Q2", equity: 95000, debt: 52000, gold: 20000, cash: 6000, reits: 3000 },
  { quarter: "Q3", equity: 140000, debt: 38000, gold: 12000, cash: 11000, reits: 5000 },
  { quarter: "Q4", equity: 160000, debt: 45000, gold: 25000, cash: 7000, reits: 2000 },
];

const config = {
  equity: { label: "Equity", color: "var(--chart-1)" },
  debt: { label: "Debt", color: "var(--chart-2)" },
  gold: { label: "Gold", color: "var(--chart-3)" },
  cash: { label: "Cash", color: "var(--chart-4)" },
  reits: { label: "REITs", color: "var(--chart-5)" },
} satisfies ChartConfig;

export default function ChartBarExample() {
  const { moneyCompact } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Money invested by quarter</CardTitle>
        <CardDescription>All five chart colours, in series order</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="quarter"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ className: "font-mono" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={moneyCompact}
              tick={{ className: "font-mono" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {Object.keys(config).map((key) => (
              <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={2} />
            ))}
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
