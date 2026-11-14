import { AreaChartCard, MetricStrip, useFormat, type MetricStripItem } from "@siyahi/ui";

const value = [
  { month: "May", equity: 2150000, debt: 600000, gold: 320000, intl: 390000, cash: 150000 },
  { month: "Jun", equity: 2230000, debt: 612000, gold: 334000, intl: 402000, cash: 160000 },
  { month: "Jul", equity: 2390000, debt: 625000, gold: 352000, intl: 421000, cash: 172000 },
  { month: "Aug", equity: 2310000, debt: 637000, gold: 371000, intl: 447000, cash: 185000 },
  { month: "Sep", equity: 2620000, debt: 648000, gold: 390000, intl: 462000, cash: 198000 },
  { month: "Oct", equity: 2800000, debt: 655000, gold: 410500, intl: 486300, cash: 212000 },
];
const kinds = [
  { key: "equity", label: "Equity", color: "var(--chart-1)" },
  { key: "debt", label: "Debt", color: "var(--chart-2)" },
  { key: "gold", label: "Gold", color: "var(--chart-3)" },
  { key: "intl", label: "International", color: "var(--chart-4)" },
  { key: "cash", label: "Cash", color: "var(--chart-5)" },
] as const;

// The gift card sales and the holdings' values last came in on 3 November: the page marks both blocks stale, and each
// loses its colour and says since when. The page decides; nothing is inferred from dates.
export default function StaleBlocksExample() {
  const { money, moneyCompact } = useFormat();
  const figures: MetricStripItem[] = [
    {
      label: "Revenue",
      value: money(4512300),
      change: 0.031,
      note: "month-end, last six months",
      trend: [3820000, 3950000, 4110000, 4020000, 4380000, 4512300],
    },
    {
      label: "Gift cards this year",
      value: moneyCompact(38400),
      change: 0.18,
      note: "sold each month",
      trend: [4100, 0, 12800, 3300, 9900, 8300],
      stale: "3 Nov",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <MetricStrip items={figures} />
      <AreaChartCard
        title="Value by kind"
        description="Month-end value of each kind of holding"
        data={value}
        xKey="month"
        series={kinds}
        valueFormatter={money}
        yTickFormatter={moneyCompact}
        height={256}
        stale="3 Nov"
      />
    </div>
  );
}
