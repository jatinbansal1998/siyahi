import {
  Area,
  AreaChart,
  CartesianGrid,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ToggleGroup,
  ToggleGroupItem,
  XAxis,
  YAxis,
  useFormat,
  type ChartConfig,
} from "@siyahi/ui";

const data = [
  { month: "May", value: 3820000, invested: 3600000 },
  { month: "Jun", value: 3950000, invested: 3685000 },
  { month: "Jul", value: 4110000, invested: 3770000 },
  { month: "Aug", value: 4020000, invested: 3855000 },
  { month: "Sep", value: 4380000, invested: 3940000 },
  { month: "Oct", value: 4512300, invested: 4025000 },
];

const config = {
  value: { label: "Value", color: "var(--chart-1)" },
  invested: { label: "Invested", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function ChartAreaExample() {
  const { moneyCompact } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio value</CardTitle>
        <CardDescription>Month-end value against money put in</CardDescription>
        <CardAction>
          <ToggleGroup defaultValue={["6M"]} variant="outline" size="sm" aria-label="Range">
            <ToggleGroupItem value="6M">6M</ToggleGroupItem>
            <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ className: "font-mono" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={moneyCompact}
              tick={{ className: "font-mono" }}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="invested"
              type="monotone"
              fill="var(--color-invested)"
              fillOpacity={0.15}
              stroke="var(--color-invested)"
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="var(--color-value)"
              fillOpacity={0.3}
              stroke="var(--color-value)"
            />
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
