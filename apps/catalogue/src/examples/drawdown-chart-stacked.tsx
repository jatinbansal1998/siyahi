import { DrawdownChartCard, LineChartCard, useFormat, type ChartSeries } from "@siyahi/ui";

// A fund and the Nifty 50 at each Friday close of 2026, both counted from 100 on the first: a seeded random walk
// with a slump from May to July, which the fund, holding more small companies, falls further in; made-up figures.
let seed = 7;
const random = () => {
  seed = (seed * 16_807) % 2_147_483_647;
  return seed / 2_147_483_647 - 0.5;
};
let index = 100;
let fund = 100;
const weeks = Array.from({ length: 52 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 2 + i * 7));
  const slump = i >= 18 && i < 27 ? -1.4 : i >= 27 && i < 34 ? 1.3 : 0;
  const market = 0.25 + slump + random() * 2.4;
  index *= 1 + market / 100;
  fund *= 1 + (market * 1.25 + 0.05 + random() * 1.2) / 100;
  return { week: date.toISOString().slice(0, 10), fund, fundReturn: fund / 100 - 1, indexReturn: index / 100 - 1 };
});
type Week = (typeof weeks)[number];

const series: ChartSeries<Week> = [
  { key: "fundReturn", label: "Your fund", color: "var(--chart-1)" },
  { key: "indexReturn", label: "Nifty 50", color: "var(--chart-2)" },
];

// The deepest fall below the best close so far, and the week it reached.
let best = 0;
const worst = weeks.reduce(
  (deepest, row) => {
    best = Math.max(best, row.fund);
    const fall = 1 - row.fund / best;
    return fall > deepest.fall ? { fall, week: row.week } : deepest;
  },
  { fall: 0, week: "" },
);

const weekOf = (n: number) => weeks[n]?.week ?? "";
const events = [
  { x: weekOf(4), label: "budget" },
  { x: weekOf(5), label: "rate cut" },
  { x: weekOf(33), label: "new fund manager", emphasis: "strong" as const },
];

export default function DrawdownChartStackedExample() {
  const { pct, fixed, dateTime } = useFormat();
  // Each Friday is a day, not a moment: written in UTC, it stays that day in every zone.
  const month = (iso: string) => dateTime(iso, { month: "short", timeZone: "UTC" });
  const day = (iso: string) => dateTime(iso, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const signed = (value: number, digits?: number) => (value > 0 ? `+${pct(value, digits)}` : pct(value, digits));
  const last = weeks.at(-1);
  const ahead = last ? (last.fundReturn - last.indexReturn) * 100 : 0;
  const ticks = weeks.filter((_, i) => i % 9 === 0).map(({ week }) => week);
  return (
    <div className="flex flex-col gap-4">
      <LineChartCard
        title={`Up ${pct(last?.fundReturn ?? 0)} this year, ${fixed(Math.abs(ahead), 1)} points ${ahead >= 0 ? "ahead of" : "behind"} the Nifty 50`}
        description="Return since the first Friday close of 2026, each week, with what moved it"
        data={weeks}
        xKey="week"
        series={series}
        xTicks={ticks}
        xFormatter={month}
        xTooltipFormatter={(iso) => `Week ending ${day(iso)}`}
        valueFormatter={(value) => signed(value)}
        yTickFormatter={(value) => signed(value, 0)}
        referenceLines={events}
        syncId="fund-2026"
      />
      <DrawdownChartCard
        title={`The worst fall was ${pct(worst.fall)}, in the week ending ${day(worst.week)}`}
        description="Each week's value, counted from 100, against the highest it had been so far. At zero the fund was at a new high."
        data={weeks}
        xKey="week"
        levelKey="fund"
        levelFormatter={(value) => fixed(value, 1)}
        label="Below its best"
        xTicks={ticks}
        xFormatter={month}
        xTooltipFormatter={(iso) => `Week ending ${day(iso)}`}
        height={200}
        syncId="fund-2026"
      />
    </div>
  );
}
