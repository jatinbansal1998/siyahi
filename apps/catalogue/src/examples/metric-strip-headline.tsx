import { MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripHeadlineExample() {
  const { money, moneyCompact } = useFormat();
  // The page's headline: three figures on solid blocks. An exception goes in a strip below, not here.
  const items: MetricStripItem[] = [
    { label: "Net worth", value: moneyCompact(4185700), change: 0.091, note: "on the year" },
    { label: "Equity share", value: "74%", note: "plan 65%" },
    { label: "Cash flow this year", value: money(-61200), note: "since April" },
  ];
  return <MetricStrip variant="blocks" items={items} />;
}
