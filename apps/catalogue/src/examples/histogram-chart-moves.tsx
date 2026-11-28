import { HistogramChartCard, useFormat } from "@siyahi/ui";

// A year of the NIFTY 50's daily moves, as fractions (0.0042 is 0.42%), the last of them today's; made-up figures
// from a fixed sequence, so the page draws the same every time.
let seed = 11;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const moves = Array.from({ length: 248 }, () => {
  const normal = Math.sqrt(-2 * Math.log(next())) * Math.cos(2 * Math.PI * next());
  return Math.round((0.05 + 0.8 * normal) * 100) / 10_000;
});
moves.push(-0.0362);
const today = moves.at(-1)!;

export default function HistogramChartMovesExample() {
  const { pct } = useFormat();
  return (
    <HistogramChartCard
      title="Today's fall was the steepest of the year"
      description="The NIFTY 50's close against the one before, each trading day of the last year, counted in buckets of half a point"
      values={moves}
      bins={16}
      valueFormatter={(value) => pct(value, 2)}
      tickFormatter={(value) => pct(value)}
      countLabel="Days"
      marks={[{ value: 0, label: "zero" }, "median", { value: today, label: "today" }]}
      xLabel="Daily move"
      yLabel="Days"
      height={280}
    />
  );
}
