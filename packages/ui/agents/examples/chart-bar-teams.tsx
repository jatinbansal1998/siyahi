import { useState } from "react";
import { BarChartCard, ToggleGroup, ToggleGroupItem, useFormat, type ChartSeries } from "@siyahi/ui";

// Each team's share of this year's spend against a comparison; made-up figures.
const SHARES = {
  Plan: [
    { team: "Engineering and Infrastructure", actual: 0.34, comparison: 0.37 },
    { team: "Sales and Business Development", actual: 0.21, comparison: 0.13 },
    { team: "Finance, Legal & Compliance", actual: 0.06, comparison: 0.1 },
    { team: "Marketing and Communications", actual: 0.12, comparison: 0.08 },
    { team: "Customer Support and Success", actual: 0.09, comparison: 0.07 },
    { team: "Operations", actual: 0.08, comparison: 0.04 },
  ],
  "Last year": [
    { team: "Engineering and Infrastructure", actual: 0.34, comparison: 0.31 },
    { team: "Sales and Business Development", actual: 0.21, comparison: 0.1 },
    { team: "Finance, Legal & Compliance", actual: 0.06, comparison: 0.08 },
    { team: "Marketing and Communications", actual: 0.12, comparison: 0.07 },
    { team: "Customer Support and Success", actual: 0.09, comparison: 0.07 },
    { team: "Operations", actual: 0.08, comparison: 0.06 },
  ],
};
type Comparison = keyof typeof SHARES;
type Row = (typeof SHARES)[Comparison][number];

export default function ChartBarTeamsExample() {
  const { pct } = useFormat();
  const [comparison, setComparison] = useState<Comparison>("Plan");
  const rows = SHARES[comparison];
  const series: ChartSeries<Row> = [
    { key: "actual", label: "This year", color: "var(--chart-1)" },
    { key: "comparison", label: comparison, color: "var(--chart-2)" },
  ];
  const gap = (row: Row) => {
    const points = Math.abs(row.actual - row.comparison) * 100;
    return `${row.actual >= row.comparison ? "+" : "\u2212"}${points.toFixed(1)} points`;
  };
  return (
    <BarChartCard
      title="Spend by team against plan or last year"
      description="Each team's share of this year's spend and of the comparison"
      action={
        <ToggleGroup
          value={[comparison]}
          onValueChange={([next]) => {
            // Pressing the selected comparison again would leave none selected; keep it.
            if (next) setComparison(next as Comparison);
          }}
          variant="outline"
          size="sm"
          aria-label="Compare with"
        >
          <ToggleGroupItem value="Plan">Plan</ToggleGroupItem>
          <ToggleGroupItem value="Last year">Last year</ToggleGroupItem>
        </ToggleGroup>
      }
      horizontal
      data={rows}
      xKey="team"
      xTickDetail={(row) => `${pct(row.actual)} against ${pct(row.comparison)}, ${gap(row)}`}
      series={series}
      valueFormatter={(v) => pct(v)}
      // A tick format puts the value axis along the bottom of the sideways bars.
      yTickFormatter={(v) => pct(v, 0)}
      // Sideways, y is still the value: the axis runs 0 to 40% and the cap is a value level.
      yDomain={[0, 0.4]}
      referenceLines={[{ y: 0.3, label: "cap 30%", labelPosition: "insideBottomRight" }]}
      height={rows.length * 56 + 48}
      footer={<p className="text-muted-foreground">Salaries are left out; they are budgeted separately.</p>}
    />
  );
}
