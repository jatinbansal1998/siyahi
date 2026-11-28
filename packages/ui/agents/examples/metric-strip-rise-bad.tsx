import { MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripRiseBadExample() {
  const { money, moneyCompact } = useFormat();
  // Costs and a loan: a rise is bad news, so the page says so and the colours follow; the signs still follow the number.
  const items: MetricStripItem[] = [
    {
      label: "Brokerage and charges",
      value: money(18450),
      change: 0.082,
      note: "against October",
      rise: "bad",
      trend: [14200, 15100, 13900, 16300, 17050, 18450],
    },
    {
      label: "Home loan outstanding",
      value: moneyCompact(2450000),
      change: -0.012,
      note: "after this month's payment",
      rise: "bad",
      trend: [2570000, 2546000, 2522000, 2498000, 2479000, 2450000],
    },
    {
      label: "Dividends received",
      value: money(9820),
      change: 0.21,
      note: "against October",
      trend: [6100, 7400, 5200, 8800, 8110, 9820],
    },
  ];
  return (
    <MetricStrip
      title="Costs up 8.2% in November"
      description="Month-end figures with the six-month run behind each"
      items={items}
    />
  );
}
