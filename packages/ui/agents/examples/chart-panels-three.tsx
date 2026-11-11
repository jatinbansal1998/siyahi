import { AreaChartCard, BarChartCard, LineChartCard, PanelGrid, useFormat } from "@siyahi/ui";

// One fund over six months: its month-end growth, its value and what was added each month.
const months = [
  { month: "May", growth: 0, value: 410000, added: 20000 },
  { month: "Jun", growth: 0.025, value: 432000, added: 15000 },
  { month: "Jul", growth: 0.061, value: 455000, added: 10000 },
  { month: "Aug", growth: 0.047, value: 461000, added: 25000 },
  { month: "Sep", growth: 0.11, value: 498000, added: 15000 },
  { month: "Oct", growth: 0.156, value: 527000, added: 20000 },
];

// Three short panels in a reading column about as wide as an article (max-w-4xl, 56rem): three across from 42rem.
export default function ChartPanelsThreeExample() {
  const { pct, money, moneyCompact } = useFormat();
  return (
    <div className="max-w-4xl">
      <PanelGrid columns={3}>
        <LineChartCard
          title="Growth"
          description="Since May, month-end"
          data={months}
          xKey="month"
          series={[{ key: "growth", label: "Growth", color: "var(--chart-1)" }]}
          valueFormatter={pct}
          height={160}
        />
        <AreaChartCard
          title="Value"
          description="Month-end, ₹"
          data={months}
          xKey="month"
          series={[{ key: "value", label: "Value", color: "var(--chart-1)" }]}
          valueFormatter={money}
          yTickFormatter={moneyCompact}
          height={160}
        />
        <BarChartCard
          title="Added"
          description="Each month, ₹"
          data={months}
          xKey="month"
          series={[{ key: "added", label: "Added", color: "var(--chart-1)" }]}
          valueFormatter={money}
          yTickFormatter={moneyCompact}
          height={160}
        />
      </PanelGrid>
    </div>
  );
}
