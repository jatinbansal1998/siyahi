import { DrawdownChartCard, useFormat } from "@siyahi/ui";

// A bakery's cash balance at the end of each week of 2026: it climbs, falls through the summer when an oven is
// replaced, and falls again in the quiet weeks of the new year; made-up figures.
const weeks = Array.from({ length: 52 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 4 + i * 7));
  const trend = 600_000 + i * 9_000;
  const oven = i >= 22 && i < 34 ? -180_000 + (i - 22) * 12_000 : 0;
  const quiet = i >= 46 ? -(i - 45) * 22_000 : 0;
  const wobble = ((i * 53) % 17) * 3_000 - 24_000;
  return { week: date.toISOString().slice(0, 10), balance: trend + oven + quiet + wobble };
});

const month = (iso: string) => new Date(iso).toLocaleString("en-IN", { month: "short", timeZone: "UTC" });
const day = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function DrawdownChartExample() {
  const { money } = useFormat();
  return (
    <DrawdownChartCard
      title="Cash below its best"
      description="Each week's balance against the highest it had been so far. At zero the bakery was at a new high."
      data={weeks}
      xKey="week"
      levelKey="balance"
      levelFormatter={money}
      label="Below its best"
      xFormatter={month}
      xTooltipFormatter={(iso) => `Week ending ${day(iso)}`}
      xTicks={weeks.filter((_, i) => i % 9 === 0).map(({ week }) => week)}
      height={260}
    />
  );
}
