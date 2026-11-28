import { WaterfallChartCard, useFormat, type WaterfallStep } from "@siyahi/ui";

// A family portfolio over the financial year, from ₹1.00 crore to ₹1.24 crore; made-up figures.
const steps: WaterfallStep[] = [
  { kind: "total", label: "1 Apr", value: 1_00_00_000 },
  { kind: "change", label: "Indian shares", value: 16_40_000 },
  { kind: "change", label: "US shares", value: 7_20_000 },
  { kind: "change", label: "Debt funds", value: 3_60_000 },
  { kind: "change", label: "Gold", value: 2_60_000 },
  { kind: "change", label: "Withdrawn", value: -4_20_000 },
  { kind: "change", label: "Fees and tax", value: -1_60_000 },
  { kind: "total", label: "31 Mar" },
];

export default function WaterfallChartPortfolioExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <WaterfallChartCard
      title="The portfolio grew ₹24 lakh this year, most of it from Indian shares"
      description="FY26, 1 April 2025 to 31 March 2026. From the broker's year-end statements."
      steps={steps}
      labels={{ rise: "Added", fall: "Taken out", total: "Portfolio" }}
      yFrom={90_00_000}
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={300}
    />
  );
}
