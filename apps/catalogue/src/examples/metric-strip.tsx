import { MetricStrip, ToggleGroup, ToggleGroupItem, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripExample() {
  const { money, moneyCompact, pct, count } = useFormat();
  // trend is each figure's month-end run, oldest first.
  const items: MetricStripItem[] = [
    {
      label: "Portfolio value",
      value: money(4512300),
      change: 0.031,
      note: "vs Sep",
      trend: [3820000, 3950000, 4110000, 4020000, 4380000, 4512300],
    },
    {
      label: "Invested",
      value: moneyCompact(4025000),
      change: 85000,
      changeFormat: "money",
      trend: [3600000, 3685000, 3770000, 3855000, 3940000, 4025000],
    },
    { label: "XIRR", value: pct(0.142), change: -0.004, trend: [0.151, 0.149, 0.152, 0.144, 0.146, 0.142] },
    { label: "Realised", value: moneyCompact(-61200), change: -61200, changeFormat: "money" },
    { label: "Dividends", value: moneyCompact(38400), change: 0.18, trend: [4100, 0, 12800, 3300, 9900, 8300] },
    { label: "Holdings", value: count(42), note: "3 bought in Oct" },
  ];
  return (
    <MetricStrip
      title="October"
      description="Month-end figures with the six-month run behind each"
      action={
        <ToggleGroup defaultValue={["1M"]} variant="outline" size="sm" aria-label="Period">
          <ToggleGroupItem value="1M">1M</ToggleGroupItem>
          <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
        </ToggleGroup>
      }
      items={items}
      footer={<p className="text-muted-foreground">Valued at the last close, 31 Oct 2026</p>}
    />
  );
}
