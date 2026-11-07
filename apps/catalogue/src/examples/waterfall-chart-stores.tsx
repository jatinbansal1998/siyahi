import { WaterfallChartCard, useFormat, type WaterfallStep } from "@siyahi/ui";

// Revenue from last year to this, store by store; made-up figures.
const steps: WaterfallStep[] = [
  { kind: "total", label: "Last year", value: 4_820_000 },
  { kind: "change", label: "Koramangala flagship", value: 640_000 },
  { kind: "change", label: "Indiranagar high street", value: 310_000 },
  { kind: "change", label: "Whitefield mall kiosk", value: -420_000 },
  { kind: "change", label: "Online orders and delivery", value: 880_000 },
  { kind: "change", label: "Jayanagar (closed in June)", value: -560_000 },
  { kind: "total", label: "This year" },
];

export default function WaterfallChartStoresExample() {
  const { money, moneyCompact } = useFormat();
  return (
    <WaterfallChartCard
      title="Revenue, last year to this"
      description="What each store added or lost on the way from last year's total to this year's"
      steps={steps}
      horizontal
      valueFormatter={money}
      yTickFormatter={moneyCompact}
      height={steps.length * 48 + 64}
    />
  );
}
