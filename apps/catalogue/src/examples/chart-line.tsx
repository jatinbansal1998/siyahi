import {
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
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
  useFormat,
  type ChartConfig,
} from "@siyahi/ui";

const data = [
  { month: "May", portfolio: 0.012, index: 0.008 },
  { month: "Jun", portfolio: 0.021, index: 0.015 },
  { month: "Jul", portfolio: 0.034, index: 0.029 },
  { month: "Aug", portfolio: -0.006, index: 0.004 },
  { month: "Sep", portfolio: 0.041, index: 0.031 },
  { month: "Oct", portfolio: 0.052, index: 0.036 },
];

const config = {
  portfolio: { label: "Portfolio", color: "var(--chart-1)" },
  index: { label: "Nifty 50", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function ChartLineExample() {
  const { pct } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Return against the index</CardTitle>
        <CardDescription>Cumulative, from the start of May</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ className: "font-mono" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => pct(v, 0)}
              tick={{ className: "font-mono" }}
            />
            <ReferenceLine y={0} stroke="var(--border)" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="portfolio" type="monotone" stroke="var(--color-portfolio)" strokeWidth={2} dot={false} />
            <Line dataKey="index" type="monotone" stroke="var(--color-index)" strokeWidth={2} dot={false} />
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
