import { AreaChartCard, BarChartCard, LineChartCard, type SeriesChartProps } from "@siyahi/ui";

const data = Array.from({ length: 84 }, (_, index) => ({
  month: `${2019 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`,
  orders: 20 + ((index * 7) % 31),
}));
const props: SeriesChartProps<(typeof data)[number], "month"> = {
  title: "Monthly orders, bars",
  description: "Demo orders per month, 2019–2025; only April is labelled",
  data,
  xKey: "month",
  xTicks: data.filter(({ month }) => month.endsWith("-04")).map(({ month }) => month),
  xFormatter: (month) => `Apr ${month.slice(2, 4)}`,
  xTooltipFormatter: (month) => month,
  series: [{ key: "orders", label: "Orders", color: "var(--chart-1)" }],
  height: 200,
};

export default function ChartCategoryTicksExample() {
  return (
    <div className="flex flex-col gap-4">
      <BarChartCard {...props} />
      <BarChartCard
        {...props}
        title="Monthly orders, sideways"
        description="Demo orders per month in 2019; only April is labelled"
        data={data.slice(0, 12)}
        xTicks={["2019-04"]}
        horizontal
        height={300}
      />
      <BarChartCard
        title="Orders by category"
        description="Demo orders; one long category label on a narrow chart"
        data={[
          { category: "Home Appliances and Kitchen Equipment", orders: 100 },
          { category: "Other", orders: 50 },
          { category: "Third", orders: 70 },
        ]}
        xKey="category"
        xTicks={["Home Appliances and Kitchen Equipment"]}
        series={[{ key: "orders", label: "Orders", color: "var(--chart-1)" }]}
        horizontal
        height={220}
      />
      <LineChartCard {...props} title="Monthly orders, line" />
      <AreaChartCard {...props} title="Monthly orders, area" />
    </div>
  );
}
