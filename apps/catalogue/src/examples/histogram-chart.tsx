import { HistogramChartCard, useFormat } from "@siyahi/ui";

// 2,000 checkout requests' response times in milliseconds: most are quick, a long tail is slow. Made-up figures from a
// fixed sequence, so the page draws the same every time.
let seed = 7;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const times = Array.from({ length: 2000 }, () => Math.round(80 + 900 * next() ** 3 + 120 * next()));

export default function HistogramChartExample() {
  const { count } = useFormat();
  return (
    <HistogramChartCard
      title="Checkout response times"
      description="The last 2,000 requests, counted in 100 ms buckets. Lines mark the median and the 95th percentile."
      values={times}
      valueFormatter={(ms) => `${count(ms)} ms`}
      tickFormatter={count}
      countLabel="Requests"
      marks={["median", "p95"]}
      xLabel="Response time (ms)"
      yLabel="Requests"
      height={280}
    />
  );
}
