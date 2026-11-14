import { Delta, MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";
import { useState } from "react";

// Each sales channel's profit this quarter and its orders; made-up figures.
const channels = [
  { label: "All", net: 110200, orders: 181 },
  { label: "Online", net: 171400, orders: 164 },
  { label: "Wholesale", net: 0, orders: 0 },
  { label: "Marketplace", net: -61200, orders: 17 },
];

export default function MetricStripSelectExample() {
  const [scope, setScope] = useState("All");
  const { count } = useFormat();
  const items: MetricStripItem[] = channels.map((c) => ({
    label: c.label,
    value: <Delta value={c.net} format="money" />,
    note: `${count(c.orders)} orders`,
    // Nothing to show for a channel with no orders, so it cannot be picked.
    disabled: c.orders === 0,
  }));
  return (
    <div className="flex flex-col gap-3">
      <MetricStrip items={items} selected={scope} onSelect={setScope} />
      <p className="text-sm text-muted-foreground">Showing {scope}</p>
    </div>
  );
}
