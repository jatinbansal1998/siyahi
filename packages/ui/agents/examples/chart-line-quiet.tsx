import { LineChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// Eight funds' month-end growth; November and December are a forecast.
const growth = [
  { month: "May", flexi: 0, debt: 0, small: 0, intl: 0, liquid: 0, midcap: 0, nifty: 0, gold: 0 },
  {
    month: "Jun",
    flexi: 0.018,
    debt: 0.006,
    small: 0.034,
    intl: 0.012,
    liquid: 0.005,
    midcap: 0.022,
    nifty: 0.025,
    gold: 0.041,
  },
  {
    month: "Jul",
    flexi: 0.049,
    debt: 0.013,
    small: 0.012,
    intl: 0.038,
    liquid: 0.011,
    midcap: 0.03,
    nifty: 0.061,
    gold: 0.072,
  },
  {
    month: "Aug",
    flexi: 0.058,
    debt: 0.02,
    small: -0.041,
    intl: 0.066,
    liquid: 0.017,
    midcap: 0.011,
    nifty: 0.047,
    gold: 0.118,
  },
  {
    month: "Sep",
    flexi: 0.094,
    debt: 0.027,
    small: -0.018,
    intl: 0.081,
    liquid: 0.023,
    midcap: 0.052,
    nifty: 0.11,
    gold: 0.153,
  },
  {
    month: "Oct",
    flexi: 0.141,
    debt: 0.034,
    small: -0.052,
    intl: 0.119,
    liquid: 0.029,
    midcap: 0.078,
    nifty: 0.156,
    gold: 0.196,
  },
  {
    month: "Nov",
    flexi: 0.166,
    debt: 0.043,
    small: -0.04,
    intl: 0.142,
    liquid: 0.037,
    midcap: 0.099,
    nifty: 0.177,
    gold: 0.221,
  },
  {
    month: "Dec",
    flexi: 0.189,
    debt: 0.052,
    small: -0.031,
    intl: 0.164,
    liquid: 0.046,
    midcap: 0.12,
    nifty: 0.202,
    gold: 0.245,
  },
];

// The palette has five colours, so past five the page names the few it is about in colour; the rest are muted, draw
// first in grey, each still named at its end.
const QUIET = "var(--muted-foreground)";
const series: ChartSeries<(typeof growth)[number]> = [
  { key: "flexi", label: "Flexi cap", color: QUIET },
  { key: "debt", label: "Debt", color: QUIET },
  { key: "small", label: "Small cap", color: QUIET },
  { key: "intl", label: "International", color: QUIET },
  { key: "liquid", label: "Liquid", color: QUIET },
  { key: "midcap", label: "Mid cap", color: QUIET },
  { key: "nifty", label: "Nifty 50", color: "var(--chart-1)" },
  { key: "gold", label: "Gold", color: "var(--chart-2)" },
];

export default function ChartLineQuietExample() {
  const { pct } = useFormat();
  return (
    <LineChartCard
      title="Growth by fund"
      description="Eight funds; the two you are watching in colour"
      data={growth}
      xKey="month"
      series={series}
      today="Oct"
      forecastFrom="Oct"
      valueFormatter={pct}
      height={256}
    />
  );
}
