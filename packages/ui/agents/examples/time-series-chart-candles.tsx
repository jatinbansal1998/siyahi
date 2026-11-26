import { TimeSeriesChartCard, useFormat, type TimeSeriesChartPane } from "@siyahi/ui";

// 120 made-up sessions of one share: each day's open, high, low and close, the shares traded, and a holding's
// gain or loss against its ₹1,480 buying price.
const level = (n: number) => 1500 + Math.sin(n / 14) * 90 + Math.sin(n / 3) * 22 + n * 0.6;
const sessions = Array.from({ length: 170 }, (_, i) => new Date(Date.UTC(2026, 5, 1 + i)))
  .filter((day) => ![0, 6].includes(day.getUTCDay()))
  .slice(0, 120)
  .map((day, i) => {
    const open = level(i);
    const close = level(i + 1);
    return {
      time: day.toISOString().slice(0, 10),
      open,
      close,
      high: Math.max(open, close) + 8 + (i % 5) * 3,
      low: Math.min(open, close) - 8 - (i % 3) * 4,
      volume: 900_000 + Math.abs(close - open) * 40_000 + (i % 7) * 60_000,
    };
  });

export default function TimeSeriesChartCandlesExample() {
  const { count, money } = useFormat();
  const panes: TimeSeriesChartPane[] = [
    { height: 220, series: [{ type: "candlestick", label: "Price", data: sessions }], format: (value) => money(value) },
    {
      height: 90,
      series: [
        {
          type: "histogram",
          label: "Shares traded",
          color: "var(--muted-foreground)",
          data: sessions.map(({ time, volume }) => ({ time, value: volume })),
        },
      ],
      format: count,
    },
    {
      height: 110,
      series: [
        {
          type: "baseline",
          label: "Gain on 100 shares",
          data: sessions.map(({ time, close }) => ({ time, value: (close - 1480) * 100 })),
        },
      ],
      levels: [{ value: 0, label: "cost" }],
      format: (value) => `${value < 0 ? "−" : "+"}${money(Math.abs(value))}`,
    },
  ];
  return (
    <TimeSeriesChartCard
      title="The share ended the half year above its buying price"
      description="Each session's open, high, low and close in ₹, the shares traded, and the gain or loss on 100 shares bought at ₹1,480. Made-up figures, June to November 2026."
      panes={panes}
      rangeToggle
      credit={false}
    />
  );
}
