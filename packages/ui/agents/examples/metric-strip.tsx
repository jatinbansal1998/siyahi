import { MetricStrip, ToggleGroup, ToggleGroupItem, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripExample() {
  const { money, moneyCompact, pct, count } = useFormat();
  // trend is each figure's month-end run, oldest first.
  const items: MetricStripItem[] = [
    {
      label: "Revenue",
      value: money(4512300),
      change: 0.031,
      note: "against September",
      trend: [3820000, 3950000, 4110000, 4020000, 4380000, 4512300],
    },
    {
      label: "Target",
      value: moneyCompact(4025000),
      change: 85000,
      changeFormat: "money",
      trend: [3600000, 3685000, 3770000, 3855000, 3940000, 4025000],
    },
    { label: "Gross margin", value: pct(0.142), change: -0.004, trend: [0.151, 0.149, 0.152, 0.144, 0.146, 0.142] },
    {
      label: "Cash flow",
      value: moneyCompact(-61200),
      change: -61200,
      changeFormat: "money",
      trend: [14200, -3800, 9100, 2600, -18400, -61200],
      // The one figure on the strip that needs a look, marked by the page: a falling margin alone would not be.
      tone: "negative",
    },
    { label: "Gift cards", value: moneyCompact(38400), change: 0.18, trend: [4100, 0, 12800, 3300, 9900, 8300] },
    { label: "Products", value: count(42), note: "3 added in Oct", trend: [38, 39, 39, 40, 39, 42] },
  ];
  return (
    <MetricStrip
      title="Revenue up 3.1% in October"
      description="Month-end figures with the six-month run behind each"
      action={
        <ToggleGroup defaultValue={["1M"]} variant="outline" size="sm" aria-label="Period">
          <ToggleGroupItem value="1M">1M</ToggleGroupItem>
          <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
        </ToggleGroup>
      }
      items={items}
      footer={<p className="text-muted-foreground">Booked up to 31 Oct 2026</p>}
    />
  );
}
