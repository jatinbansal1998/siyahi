import { Badge, ScatterChartCard, useFormat, type ScatterPoint } from "@siyahi/ui";
import { useState } from "react";

interface Store extends ScatterPoint {
  region: string;
  sales: number;
}

// x is the store's share of the month's sales and y its growth on the same month last year; the numbers are made up
// for the catalogue. The Guwahati store opened this year, so it has no growth to plot. Largest first, so the biggest
// stores take the labels.
const stores: Store[] = [
  { name: "Delhi Saket", region: "North", x: 0.112, y: 0.27, sales: 2760000 },
  { name: "Bengaluru MG", region: "South", x: 0.106, y: -0.06, sales: 2625000 },
  { name: "Chennai T Nagar", region: "South", x: 0.104, y: 0.44, sales: 2580000 },
  { name: "Kolkata Park St", region: "East", x: 0.103, y: 0.16, sales: 2556000 },
  { name: "Mumbai Online", key: "mumbai-online", region: "West", x: 0.091, y: 0.38, sales: 2244000 },
  { name: "Pune Camp", region: "West", x: 0.067, y: 0.09, sales: 1660000 },
  { name: "Mumbai Bandra", key: "mumbai-bandra", region: "West", x: 0.061, y: 0.12, sales: 1520000 },
  { name: "Hyderabad", region: "South", x: 0.052, y: -0.14, sales: 1290000 },
  { name: "Ahmedabad", region: "West", x: 0.044, y: 0.05, sales: 1090000 },
  { name: "Surat", region: "West", x: 0.04, y: -0.21, sales: 980000 },
  { name: "Kochi", region: "South", x: 0.035, y: 0.58, sales: 870000 },
  { name: "Lucknow", region: "North", x: 0.031, y: -0.02, sales: 770000 },
  { name: "Jaipur", region: "North", x: 0.026, y: -0.33, sales: 640000 },
  { name: "Bhubaneswar", region: "East", x: 0.021, y: 0.22, sales: 520000 },
  { name: "Indore", region: "Central", x: 0.018, y: 0.31, sales: 450000 },
  { name: "Bhopal", region: "Central", x: 0.012, y: -0.09, sales: 300000 },
  { name: "Patna", region: "East", x: 0.009, y: 0.47, sales: 220000 },
  { name: "Nagpur", region: "Central", x: 0.007, y: 0.02, sales: 170000 },
  { name: "Shillong", region: "Northeast", x: 0.004, y: -0.18, sales: 100000 },
  { name: "Guwahati", region: "Northeast", x: 0.021, y: null, sales: 520000 },
];

export default function ScatterChartExample() {
  const [selected, setSelected] = useState<Store | null>(null);
  const { money, pct } = useFormat();
  const growth = (y: number | null) => (y === null ? "new this year" : `${y < 0 ? "−" : "+"}${pct(Math.abs(y))}`);
  const missing = stores.filter((s) => s.y === null).length;
  return (
    <ScatterChartCard
      title="Stores by size and growth"
      description="Across is the store's share of sales, up its growth on last year. Log spreads out the small stores; Linear shows how far ahead the largest are."
      action={<Badge variant="outline">This month</Badge>}
      points={stores}
      height={360}
      xLabel="Share of sales"
      yLabel="Growth"
      // Log is selected first; the buttons in the header let the reader switch.
      xScale="log"
      xScaleToggle
      xFormatter={(x) => pct(x)}
      yFormatter={(y) => growth(y)}
      details={(s) => [
        ["Region", s.region],
        ["Sales", money(s.sales)],
        ["Growth", growth(s.y)],
      ]}
      selected={selected}
      onSelect={setSelected}
      footer={
        <>
          <p data-slot="scatter-selection" aria-live="polite" className="tabular-nums">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span> · {selected.region} · {money(selected.sales)} ·{" "}
                {growth(selected.y)}
              </>
            ) : (
              <span className="text-muted-foreground">Tap a dot for its figures</span>
            )}
          </p>
          <p className="text-muted-foreground">{missing} store opened this year and has no growth to plot.</p>
        </>
      }
    />
  );
}
