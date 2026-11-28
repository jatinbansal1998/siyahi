import { MetricStrip, type MetricStripItem } from "@siyahi/ui";

export default function MetricStripPairExample() {
  // Two figures that answer one question: how far the index moved, and how many of its members moved with it.
  const items: MetricStripItem[] = [
    { label: "Nifty 50 move", value: "+1.85%", note: "since October's last close, through 27 Nov" },
    { label: "Stocks that rose", value: "29 of 49", note: "of the 50 members, 49 had both closes" },
  ];
  return (
    <MetricStrip title="Most of the index rose with it" description="Nifty 50 breadth in November" items={items} />
  );
}
