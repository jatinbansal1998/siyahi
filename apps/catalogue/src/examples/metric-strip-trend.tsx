import { MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripTrendExample() {
  const { money, moneyCompact } = useFormat();
  // trend is each figure's run, oldest first; its change's sign colours it.
  const items: MetricStripItem[] = [
    {
      label: "Revenue",
      value: money(4512300),
      change: 0.031,
      note: "month-end, last six months",
      trend: [3820000, 3950000, 4110000, 4020000, 4380000, 4512300],
    },
    {
      label: "Cash flow this year",
      value: moneyCompact(-61200),
      change: -61200,
      changeFormat: "money",
      note: "running total since April",
      trend: [0, -8200, -14100, -30400, -52800, -61200],
      // The one figure on the page that needs a look, marked by the page: a falling cost would not be.
      tone: "negative",
    },
    {
      label: "Gift cards this year",
      value: moneyCompact(38400),
      change: 0.18,
      note: "sold each month",
      trend: [4100, 0, 12800, 3300, 9900, 8300],
    },
  ];
  return <MetricStrip items={items} />;
}
