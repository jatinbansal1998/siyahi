import { AreaChartCard, BarChartCard, LineChartCard, PanelGrid, useFormat, type ChartSeries } from "@siyahi/ui";

// Month-end growth of five funds; November and December are a forecast.
const growth = [
  { month: "May", nifty: 0, flexi: 0, gold: 0, debt: 0, small: 0 },
  { month: "Jun", nifty: 0.025, flexi: 0.018, gold: 0.041, debt: 0.006, small: 0.034 },
  { month: "Jul", nifty: 0.061, flexi: 0.049, gold: 0.072, debt: 0.013, small: 0.012 },
  { month: "Aug", nifty: 0.047, flexi: 0.058, gold: 0.118, debt: 0.02, small: -0.041 },
  { month: "Sep", nifty: 0.11, flexi: 0.094, gold: 0.153, debt: 0.027, small: -0.018 },
  { month: "Oct", nifty: 0.156, flexi: 0.141, gold: 0.196, debt: 0.034, small: -0.052 },
  { month: "Nov", nifty: 0.177, flexi: 0.166, gold: 0.221, debt: 0.043, small: -0.04 },
  { month: "Dec", nifty: 0.202, flexi: 0.189, gold: 0.245, debt: 0.052, small: -0.031 },
];
const funds: ChartSeries<(typeof growth)[number]> = [
  { key: "nifty", label: "Nifty 50", color: "var(--chart-1)" },
  { key: "flexi", label: "Flexi cap", color: "var(--chart-2)" },
  { key: "gold", label: "Gold", color: "var(--chart-3)" },
  { key: "debt", label: "Debt", color: "var(--chart-4)" },
  { key: "small", label: "Small cap", color: "var(--chart-5)" },
];

const value = [
  { month: "May", equity: 2150000, debt: 600000, gold: 320000, intl: 390000, cash: 150000 },
  { month: "Jun", equity: 2230000, debt: 612000, gold: 334000, intl: 402000, cash: 160000 },
  { month: "Jul", equity: 2390000, debt: 625000, gold: 352000, intl: 421000, cash: 172000 },
  { month: "Aug", equity: 2310000, debt: 637000, gold: 371000, intl: 447000, cash: 185000 },
  { month: "Sep", equity: 2620000, debt: 648000, gold: 390000, intl: 462000, cash: 198000 },
  { month: "Oct", equity: 2800000, debt: 655000, gold: 410500, intl: 486300, cash: 212000 },
];
const added = [
  { quarter: "Q1", equity: 180000, debt: 60000, gold: 20000, intl: 40000, cash: 25000 },
  { quarter: "Q2", equity: 220000, debt: 40000, gold: 45000, intl: 35000, cash: 15000 },
  { quarter: "Q3", equity: 150000, debt: 80000, gold: 30000, intl: 55000, cash: 30000 },
  { quarter: "Q4", equity: 260000, debt: 50000, gold: 60000, intl: 70000, cash: 20000 },
];
const kinds = [
  { key: "equity", label: "Equity", color: "var(--chart-1)" },
  { key: "debt", label: "Debt", color: "var(--chart-2)" },
  { key: "gold", label: "Gold", color: "var(--chart-3)" },
  { key: "intl", label: "International", color: "var(--chart-4)" },
  { key: "cash", label: "Cash", color: "var(--chart-5)" },
] as const;

// Four charts in a PanelGrid: lines named at their ends, a forecast after today, overlapping areas as lines, and bars
// as tints inside full-colour edges, grouped and stacked.
export default function ChartPanelsExample() {
  const { pct, money, moneyCompact } = useFormat();
  return (
    <PanelGrid>
      <LineChartCard
        title="Growth by fund"
        description="Since May, month-end; November and December are a forecast"
        data={growth}
        xKey="month"
        series={funds}
        today="Oct"
        forecastFrom="Oct"
        valueFormatter={pct}
        height={256}
      />
      <AreaChartCard
        title="Value by kind"
        description="Month-end value of each kind of holding"
        data={value}
        xKey="month"
        series={kinds}
        valueFormatter={money}
        yTickFormatter={moneyCompact}
        height={256}
      />
      <BarChartCard
        title="Money added by kind and quarter"
        description="Side by side"
        data={added}
        xKey="quarter"
        series={kinds}
        valueFormatter={money}
        yTickFormatter={moneyCompact}
        height={256}
      />
      <BarChartCard
        title="Money added by kind and quarter"
        description="Stacked into the quarter's total"
        data={added}
        xKey="quarter"
        series={kinds}
        stacked
        valueFormatter={money}
        yTickFormatter={moneyCompact}
        height={256}
      />
    </PanelGrid>
  );
}
