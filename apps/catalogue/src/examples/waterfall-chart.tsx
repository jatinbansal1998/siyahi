import { WaterfallChartCard, useFormat, type WaterfallStep } from "@siyahi/ui";

// A bakery's profit for the year, April to March, month by month; made-up figures.
const months: [string, number][] = [
  ["Apr", 42000],
  ["May", 38000],
  ["Jun", -12000],
  ["Jul", 26000],
  ["Aug", 31000],
  ["Sep", -8000],
  ["Oct", 54000],
  ["Nov", 61000],
  ["Dec", 72000],
  ["Jan", -21000],
  ["Feb", 18000],
  ["Mar", 35000],
];
const steps: WaterfallStep[] = [
  ...months.map(([label, value]): WaterfallStep => ({ kind: "change", label, value })),
  // No value: the year's total is wherever the months left it.
  { kind: "total", label: "Year" },
];

export default function WaterfallChartExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <WaterfallChartCard
      title="Profit for the year, month by month"
      description="April to March, before tax. Each bar starts where the month before left off."
      steps={steps}
      labels={{ rise: "Profit", fall: "Loss", total: "Year to date" }}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={300}
    />
  );
}
