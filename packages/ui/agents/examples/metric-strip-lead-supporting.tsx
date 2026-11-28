import { MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripLeadSupportingExample() {
  const { money, moneyCompact } = useFormat();
  // A portfolio's page is about what it is worth; the gain and the cash waiting to be invested support it.
  const items: MetricStripItem[] = [
    { label: "Worth", value: money(12452380), change: 0.0039, note: "today, at the 27 Nov 2026 close" },
    { label: "Gain since April", value: moneyCompact(1462400), change: 0.133, note: "Nifty 50 +6.1%" },
    { label: "Cash to invest", value: money(385400), note: "in savings and a liquid fund" },
  ];
  return <MetricStrip variant="lead" items={items} />;
}
