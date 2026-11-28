import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
  CalendarHeatmapFooter,
  CalendarHeatmapLegend,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChangeBar,
  DataTable,
  DataTableBody,
  DataTableCompactColumnsToggle,
  DataTableFacetedFilter,
  DataTableFootnote,
  DataTableHeader,
  DataTableRoot,
  DataTableRowCount,
  DataTableSortHeader,
  DataTableToolbarSection,
  Delta,
  DrawdownChartCard,
  LineChartCard,
  MetricStrip,
  PageHeader,
  PageSection,
  PanelGrid,
  RangePosition,
  Sparkline,
  TargetRows,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Treemap,
  TreemapLegend,
  WaterfallChartCard,
  dataTableDetailsColumn,
  useDataTable,
  useFormat,
  type ChartSeries,
  type DataTableColumnDef,
  type TargetRow,
  type TargetStatus,
  type TreemapItem,
  type WaterfallStep,
} from "@siyahi/ui";
import { useState } from "react";

// One person's investments on Friday 27 Nov 2026, eight months into FY27 (April 2026 to March 2027). Every figure is
// made up; every figure the page writes is worked out from the data below, so no title can go stale.

type AssetClass = "Indian equity" | "International" | "Debt" | "Gold" | "Cash";

interface Holding {
  name: string;
  assetClass: AssetClass;
  /** Worth at the 27 Nov close, in rupees. */
  worth: number;
  /** The change on 27 Nov, as a fraction of the worth at the close before. */
  day: number;
  /** Gain since the 31 Mar close, in rupees, with money put in since then left out. */
  gain: number;
  /** Last price or fund value, and its 52-week low and high. */
  price: number;
  low: number;
  high: number;
}

const holdings: Holding[] = [
  {
    name: "Nifty 50 index fund",
    assetClass: "Indian equity",
    worth: 2461380,
    day: 0.0041,
    gain: 261400,
    price: 268.42,
    low: 221.1,
    high: 270.15,
  },
  {
    name: "Flexi cap fund",
    assetClass: "Indian equity",
    worth: 1418950,
    day: 0.0036,
    gain: 184200,
    price: 91.37,
    low: 74.8,
    high: 92.06,
  },
  {
    name: "Midcap 150 index fund",
    assetClass: "Indian equity",
    worth: 982640,
    day: 0.0058,
    gain: 149300,
    price: 22.64,
    low: 17.42,
    high: 22.91,
  },
  {
    name: "HDFC Bank",
    assetClass: "Indian equity",
    worth: 841260,
    day: 0.0072,
    gain: 102800,
    price: 1962.3,
    low: 1612.4,
    high: 1988,
  },
  {
    name: "Infosys",
    assetClass: "Indian equity",
    worth: 693480,
    day: 0.0124,
    gain: 71900,
    price: 1846.1,
    low: 1402.55,
    high: 1902.8,
  },
  {
    name: "Small cap fund",
    assetClass: "Indian equity",
    worth: 607210,
    day: -0.0031,
    gain: 38600,
    price: 164.08,
    low: 139.5,
    high: 178.22,
  },
  {
    name: "Larsen & Toubro",
    assetClass: "Indian equity",
    worth: 558920,
    day: 0.0049,
    gain: 64300,
    price: 3912.4,
    low: 3220,
    high: 3968.75,
  },
  {
    name: "ITC",
    assetClass: "Indian equity",
    worth: 371150,
    day: -0.0022,
    gain: -9800,
    price: 418.35,
    low: 392.1,
    high: 498.6,
  },
  {
    name: "Tata Motors",
    assetClass: "Indian equity",
    worth: 288740,
    day: -0.0184,
    gain: -61200,
    price: 682.15,
    low: 655.3,
    high: 1012.4,
  },
  {
    name: "Nasdaq 100 fund",
    assetClass: "International",
    worth: 964310,
    day: 0.0093,
    gain: 138700,
    price: 41.26,
    low: 31.84,
    high: 42.1,
  },
  {
    name: "Short-term debt fund",
    assetClass: "Debt",
    worth: 1238470,
    day: 0.0002,
    gain: 52100,
    price: 31.84,
    low: 30.12,
    high: 31.86,
  },
  {
    name: "Corporate bond fund",
    assetClass: "Debt",
    worth: 621830,
    day: 0.0001,
    gain: 27400,
    price: 18.62,
    low: 17.71,
    high: 18.63,
  },
  {
    name: "Gold bonds 2031",
    assetClass: "Gold",
    worth: 782600,
    day: -0.0058,
    gain: 146200,
    price: 12840,
    low: 9640,
    high: 13105,
  },
  {
    name: "Gold ETF",
    assetClass: "Gold",
    worth: 308940,
    day: -0.0061,
    gain: 57800,
    price: 108.42,
    low: 81.3,
    high: 110.65,
  },
  {
    name: "Liquid fund",
    assetClass: "Cash",
    worth: 312500,
    day: 0.0002,
    gain: 11600,
    price: 3412.8,
    low: 3268.1,
    high: 3413.05,
  },
];

/** The mix the owner set out to keep, as shares of the whole. */
const PLAN: Record<AssetClass, number> = {
  "Indian equity": 0.6,
  International: 0.1,
  Debt: 0.2,
  Gold: 0.08,
  Cash: 0.02,
};
const CLASSES = Object.keys(PLAN) as AssetClass[];
/** Each class as it reads inside a sentence. */
const IN_A_SENTENCE: Record<AssetClass, string> = {
  "Indian equity": "Indian equity",
  International: "international",
  Debt: "debt",
  Gold: "gold",
  Cash: "cash",
};

// Within two points of plan is on plan; past five is far enough to act on.
const NEAR = 0.02;
const FAR = 0.05;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const total = sum(holdings.map((h) => h.worth));
const dayGain = sum(holdings.map((h) => h.worth - h.worth / (1 + h.day)));
const marketGain = sum(holdings.map((h) => h.gain));

const classes = CLASSES.map((name) => {
  const members = holdings.filter((h) => h.assetClass === name);
  const worth = sum(members.map((h) => h.worth));
  return { name, worth, share: worth / total, gain: sum(members.map((h) => h.gain)) };
});

// --- A year of history. ------------------------------------------------------------------------------------------
// The days and their shape are made up; the path is then pinned so it ends on today's worth, with the money put in
// along the way, and its last day is the day's change the holdings add up to.

const HOLIDAYS = new Set(["2026-04-03", "2026-04-14", "2026-05-01", "2026-10-02", "2026-11-10", "2026-11-24"]);
const tradingDays: string[] = [];
for (let d = new Date(Date.UTC(2026, 3, 1)); d <= new Date(Date.UTC(2026, 10, 27)); d.setUTCDate(d.getUTCDate() + 1)) {
  const iso = d.toISOString().slice(0, 10);
  if (d.getUTCDay() % 6 !== 0 && !HOLIDAYS.has(iso)) tradingDays.push(iso);
}

// A monthly investment of ₹1L on the first trading day from the 5th, and a ₹4L bonus put in on 15 Jun.
const BONUS_DAY = "2026-06-15";
const flows = new Map<string, number>([[BONUS_DAY, 400000]]);
for (let month = 4; month <= 11; month++) {
  const from = `2026-${String(month).padStart(2, "0")}-05`;
  const day = tradingDays.find((d) => d >= from);
  if (day) flows.set(day, (flows.get(day) ?? 0) + 100000);
}
const moneyAdded = sum([...flows.values()]);
const startWorth = total - moneyAdded - marketGain;

// A seeded generator, so every load draws the same year.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

// A climb to late July, a slide to early September, and a climb to new highs.
const drift = (day: string) => (day < "2026-07-22" ? 0.001 : day < "2026-09-03" ? -0.0028 : 0.0017);
const market = random(27);
const own = random(11);
const shocks = tradingDays.map(() => market() + market() + market());
const bookShape = tradingDays.map((day, i) => drift(day) + 0.009 * (shocks[i] ?? 0));
const niftyShape = tradingDays.map((day, i) => 0.85 * drift(day) + 0.009 * (0.8 * (shocks[i] ?? 0) + 0.6 * own()));

/** The constant to add to every return but the last so the path ends where it must; worth only grows with it. */
function pin(end: (shift: number) => number, target: number): number {
  let [low, high] = [-0.01, 0.01];
  for (let step = 0; step < 60; step++) {
    const mid = (low + high) / 2;
    if (end(mid) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

const lastReturn = dayGain / (total - dayGain);
const bookReturns = (shift: number) => bookShape.map((r, i) => (i === bookShape.length - 1 ? lastReturn : r + shift));
const worthAtEnd = (returns: number[]) =>
  returns.reduce((worth, r, i) => (worth + (flows.get(tradingDays[i] ?? "") ?? 0)) * (1 + r), startWorth);
const bookPath = bookReturns(pin((shift) => worthAtEnd(bookReturns(shift)), total));

const NIFTY_SINCE_APRIL = 0.086;
const niftyReturns = (shift: number) => niftyShape.map((r) => r + shift);
const growth = (returns: number[]) => returns.reduce((g, r) => g * (1 + r), 1);
const niftyPath = niftyReturns(pin((shift) => growth(niftyReturns(shift)), 1 + NIFTY_SINCE_APRIL));

interface Day {
  day: string;
  /** Worth at the close. */
  worth: number;
  /** The day's gain or loss in rupees, money put in that day left out. */
  pnl: number;
  /** Return since the 31 Mar close, with money put in left out, and the Nifty 50's. */
  book: number;
  nifty: number;
  /** What ₹1L left in since 31 Mar would be worth: the return as a level, for the fall from its best. */
  level: number;
}

const history: Day[] = [{ day: "2026-03-31", worth: startWorth, pnl: 0, book: 0, nifty: 0, level: 100000 }];
tradingDays.forEach((day, i) => {
  const before = history[history.length - 1];
  if (!before) return;
  const r = bookPath[i] ?? 0;
  const invested = before.worth + (flows.get(day) ?? 0);
  const growthToDate = (1 + before.book) * (1 + r);
  history.push({
    day,
    worth: invested * (1 + r),
    pnl: invested * r,
    book: growthToDate - 1,
    nifty: (1 + before.nifty) * (1 + (niftyPath[i] ?? 0)) - 1,
    level: 100000 * growthToDate,
  });
});
const sinceApril = history[history.length - 1]?.book ?? 0;

// The deepest fall from a high, and the day the high was made back.
const falls = history.reduce(
  (acc, row) => {
    if (row.level > acc.peak.level) acc.peak = row;
    const depth = 1 - row.level / acc.peak.level;
    if (depth > acc.depth) Object.assign(acc, { depth, from: acc.peak, to: row });
    return acc;
  },
  { peak: history[0] as Day, depth: 0, from: history[0] as Day, to: history[0] as Day },
);
const madeBack = history.find((row) => row.day > falls.to.day && row.level >= falls.from.level);

const monthStarts = history.filter((row, i) => i > 0 && row.day.slice(5, 7) !== history[i - 1]?.day.slice(5, 7));

// --- Words. --------------------------------------------------------------------------------------------------------

const sign = (value: number) => (value > 0 ? "+" : value < 0 ? "\u2212" : "");

function useWords() {
  const f = useFormat();
  const day = (iso: string) => f.dateTime(iso, { day: "numeric", month: "short", timeZone: "UTC" });
  return {
    ...f,
    day,
    fullDay: (iso: string) =>
      f.dateTime(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
    month: (iso: string) => f.dateTime(iso, { month: "short", timeZone: "UTC" }),
    signedMoney: (value: number) => `${sign(value)}${f.money(Math.abs(value))}`,
    signedCompact: (value: number) => `${sign(value)}${f.moneyCompact(Math.abs(value))}`,
    signedPct: (value: number, digits?: number) => `${sign(value)}${f.pct(Math.abs(value), digits)}`,
    points: (value: number) => `${(Math.abs(value) * 100).toFixed(1)} points`,
  };
}

// --- The headline. -------------------------------------------------------------------------------------------------

function Headline() {
  const w = useWords();
  return (
    <MetricStrip
      variant="blocks"
      items={[
        { label: "Worth", value: w.money(total), note: "at the 27 Nov close" },
        { label: "Day's change", value: w.signedMoney(dayGain), change: lastReturn, note: "on Friday" },
        {
          label: "Gain since April",
          value: w.signedCompact(marketGain),
          change: sinceApril,
          note: `Nifty 50 ${w.signedPct(NIFTY_SINCE_APRIL)}`,
        },
      ]}
    />
  );
}

// --- What it is made of. -------------------------------------------------------------------------------------------

interface Tile extends TreemapItem {
  holding: Holding;
}

const tiles: Tile[] = holdings.map((holding) => ({
  name: holding.name,
  weight: holding.worth,
  change: holding.day,
  group: holding.assetClass,
  holding,
}));

function Holdings() {
  const w = useWords();
  const [hovered, setHovered] = useState<Tile | null>(null);
  const [selected, setSelected] = useState<Tile | null>(null);
  const largest = classes.reduce((a, b) => (b.worth > a.worth ? b : a));
  const figures = ({ holding }: Tile) =>
    `${w.money(holding.worth)} · ${w.pct(holding.worth / total)} of the whole · ${w.signedPct(holding.day, 2)} on Friday`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {largest.name} is {w.pct(largest.share, 0)} of your money
        </CardTitle>
        <CardDescription>
          Each holding by asset class. Area is its worth; colour is its change on Friday, deepest at ±2%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tooltip open={hovered !== null} trackCursorAxis="both">
          <TooltipTrigger render={<div />}>
            <Treemap
              items={tiles}
              height={320}
              range={0.02}
              onHover={setHovered}
              selected={selected}
              onSelect={setSelected}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {hovered && (
              <div className="flex flex-col items-start">
                <span className="font-medium">{hovered.name}</span>
                <span>{figures(hovered)}</span>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p aria-live="polite" className="text-sm">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span> · {figures(selected)}
              </>
            ) : (
              <span className="text-muted-foreground">Tap a tile for its figures</span>
            )}
          </p>
          <TreemapLegend range={0.02} />
        </div>
      </CardContent>
    </Card>
  );
}

function statusOf(gap: number, w: ReturnType<typeof useWords>): TargetStatus {
  const size = `${w.points(gap)} ${gap > 0 ? "over" : "under"}`;
  if (Math.abs(gap) <= NEAR) return { kind: "met", label: "On plan" };
  if (Math.abs(gap) <= FAR) return { kind: "missed", label: size };
  return { kind: "warning", label: `${size}, rebalance` };
}

function Mix() {
  const w = useWords();
  const rows: TargetRow[] = classes.map((c) => ({
    label: c.name,
    detail: w.moneyCompact(c.worth),
    value: c.share,
    target: PLAN[c.name],
    bands: [
      [PLAN[c.name] - FAR, PLAN[c.name] + FAR],
      [PLAN[c.name] - NEAR, PLAN[c.name] + NEAR],
    ],
    status: statusOf(c.share - PLAN[c.name], w),
  }));
  const off = classes.filter((c) => Math.abs(c.share - PLAN[c.name]) > FAR);
  const over = classes.reduce((a, b) => (b.share - PLAN[b.name] > a.share - PLAN[a.name] ? b : a));
  const under = classes.reduce((a, b) => (b.share - PLAN[b.name] < a.share - PLAN[a.name] ? b : a));
  const move = over.worth - PLAN[over.name] * total;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {off.length === 0
            ? "Every asset class is within five points of plan"
            : `${off
                .map((c, i) => {
                  const gap = c.share - PLAN[c.name];
                  return `${i === 0 ? c.name : IN_A_SENTENCE[c.name]} ${w.points(gap)} ${gap > 0 ? "over" : "under"}`;
                })
                .join(", ")} plan`}
        </CardTitle>
        <CardDescription>
          Each asset class's share of your money against the share you planned, on one 0–70% scale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            Bar: its share now. Tall tick: the plan. Shading: within 5 points of plan, darker within 2.
          </p>
          <TargetRows rows={rows} domain={[0, 0.7]} valueFormatter={(value) => w.pct(value)} />
        </div>
      </CardContent>
      {off.length > 0 && (
        <CardFooter>
          <p className="text-sm">
            Moving {w.moneyCompact(move)} from {IN_A_SENTENCE[over.name]} to {IN_A_SENTENCE[under.name]} puts{" "}
            {IN_A_SENTENCE[over.name]} on plan and {IN_A_SENTENCE[under.name]} at {w.pct((under.worth + move) / total)}.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

// --- How it got here. ----------------------------------------------------------------------------------------------

function Bridge() {
  const w = useWords();
  const steps: WaterfallStep[] = [
    { kind: "change", label: "Money you put in", value: moneyAdded },
    ...classes
      .toSorted((a, b) => b.gain - a.gain)
      .map((c): WaterfallStep => ({ kind: "change", label: `${c.name} gains`, value: c.gain })),
    { kind: "total", label: "Growth since April" },
  ];
  return (
    <WaterfallChartCard
      title={`Your money grew ${w.moneyCompact(total - startWorth)} since April: ${w.moneyCompact(marketGain)} from markets, ${w.moneyCompact(moneyAdded)} you put in`}
      description={`From ${w.money(startWorth)} at the 31 Mar close to ${w.money(total)} at the 27 Nov close. Each bar starts where the one above left off.`}
      steps={steps}
      horizontal
      labels={{ rise: "Gain", fall: "Loss", total: "Growth" }}
      valueFormatter={w.money}
      yTickFormatter={w.moneyCompact}
      height={320}
    />
  );
}

function Days() {
  const w = useWords();
  const days = history.slice(1);
  const [picked, setPicked] = useState<{ date: string; value: number } | null>(null);
  const worst = days.reduce((a, b) => (b.pnl < a.pnl ? b : a));
  const best = days.reduce((a, b) => (b.pnl > a.pnl ? b : a));
  const lossDays = days.filter((d) => d.pnl < 0).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Worst day {w.day(worst.day)}, {w.signedCompact(worst.pnl)}; best {w.day(best.day)},{" "}
          {w.signedCompact(best.pnl)}
        </CardTitle>
        <CardDescription>
          Each trading day's gain or loss on everything you own, money put in left out. {days.length - lossDays} days
          gained, {lossDays} lost. Square green days gained, round red days lost; deeper is more. Weekends and market
          holidays are grey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap
          data={days.map((d) => ({ date: d.day, value: Math.round(d.pnl) }))}
          signed
          weekStart={1}
          labels={{ heatmapLabel: "Gain or loss by day, April to November", cellLabel: "{{date}}: {{value}} rupees" }}
        >
          <CalendarHeatmapBody>
            {({ activity, dayIndex, weekIndex }) => (
              <CalendarHeatmapBlock
                activity={activity}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                selected={activity.date === picked?.date}
                onCellClick={(cell) => setPicked(cell.date === picked?.date ? null : cell)}
              />
            )}
          </CalendarHeatmapBody>
          <CalendarHeatmapFooter className="whitespace-normal">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p aria-live="polite" className="text-sm">
                {picked
                  ? `${w.fullDay(picked.date)}: ${w.signedMoney(picked.value)}`
                  : "Tap a day for its gain or loss"}
              </p>
              <CalendarHeatmapLegend labels={{ less: "Loss", more: "Gain" }} valueFormatter={w.moneyCompact} />
            </div>
          </CalendarHeatmapFooter>
        </CalendarHeatmap>
      </CardContent>
    </Card>
  );
}

// --- Against the market. -------------------------------------------------------------------------------------------

const returnSeries: ChartSeries<Day> = [
  { key: "book", label: "Your money", color: "var(--chart-1)" },
  { key: "nifty", label: "Nifty 50", color: "var(--chart-2)" },
];

function Race() {
  const w = useWords();
  const ahead = sinceApril - NIFTY_SINCE_APRIL;
  return (
    <LineChartCard
      title={`Up ${w.pct(sinceApril)} since April, ${w.points(ahead)} ${ahead >= 0 ? "ahead of" : "behind"} the Nifty 50`}
      description="Return on each trading day's close since 31 Mar, with money put in left out, so the bonus does not count as a gain"
      data={history}
      xKey="day"
      series={returnSeries}
      xTicks={monthStarts.map((row) => row.day)}
      xFormatter={w.month}
      xTooltipFormatter={w.fullDay}
      valueFormatter={(value) => w.signedPct(value)}
      yTickFormatter={(value) => w.signedPct(value, 0)}
      referenceLines={[
        { x: BONUS_DAY, label: "₹4L bonus put in", labelPosition: "insideBottomLeft" },
        ...(madeBack
          ? [
              {
                x: madeBack.day,
                label: "back at its high",
                emphasis: "strong" as const,
                labelPosition: "insideTopRight" as const,
              },
            ]
          : []),
      ]}
      syncId="since-april"
    />
  );
}

function Falls() {
  const w = useWords();
  return (
    <DrawdownChartCard
      title={`The worst fall was ${w.pct(falls.depth)}, from ${w.day(falls.from.day)} to ${w.day(falls.to.day)}${madeBack ? `, made back by ${w.day(madeBack.day)}` : ""}`}
      description="What ₹1L left in since 31 Mar would have been worth each day, against the best it had been. At zero it was at a new high."
      data={history}
      xKey="day"
      levelKey="level"
      levelFormatter={w.money}
      label="Below its best"
      xTicks={monthStarts.map((row) => row.day)}
      xFormatter={w.month}
      xTooltipFormatter={w.fullDay}
      height={220}
      syncId="since-april"
    />
  );
}

// --- Every holding. ------------------------------------------------------------------------------------------------

interface Row extends Holding {
  /** Return since 31 Mar, and a made-up weekly run to it, oldest first. */
  since: number;
  weekly: number[];
}

const rows: Row[] = holdings.map((h, index) => {
  const since = h.gain / (h.worth - h.gain);
  const wobble = random(100 + index);
  const weekly = Array.from({ length: 35 }, (_, week) => (1 + since) ** (week / 34) * (1 + 0.025 * wobble()));
  return Object.assign({ since, weekly }, h);
});

const largestGain = Math.max(...rows.map((r) => Math.abs(r.gain)));
// The page's rule for a holding that needs a look: in the bottom tenth of its 52-week range.
const tone = (row: Row): "warning" | undefined =>
  (row.price - row.low) / (row.high - row.low) < 0.1 ? "warning" : undefined;

function Worth({ row }: { row: Row }) {
  const w = useWords();
  const { compactColumns } = useDataTable<Row>();
  if (!compactColumns?.hidden.has("day")) return w.money(row.worth);
  return (
    <div className="flex flex-col items-end">
      {w.money(row.worth)}
      <Delta value={row.day} />
    </div>
  );
}

function Range({ row }: { row: Row }) {
  const { money } = useFormat();
  return (
    <RangePosition
      variant="compact"
      low={row.low}
      high={row.high}
      value={row.price}
      lowLabel="52-week low"
      highLabel="52-week high"
      valueFormatter={(value) => money(value, value < 1000 ? 2 : 0)}
    />
  );
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Row>[] = [
  dataTableDetailsColumn<Row>(),
  { accessorKey: "name", header, size: 170, meta: { label: "Holding", compact: true } },
  {
    accessorKey: "worth",
    header,
    size: 120,
    meta: { label: "Worth", variant: "number", compact: true },
    cell: ({ row }) => <Worth row={row.original} />,
  },
  {
    accessorKey: "day",
    header,
    size: 110,
    meta: { label: "Day's change", variant: "number" },
    cell: ({ row }) => <Delta value={row.original.day} />,
  },
  {
    accessorKey: "gain",
    header,
    size: 150,
    meta: { label: "Gain since April", variant: "number" },
    cell: ({ row }) => <ChangeBar value={row.original.gain} max={largestGain} diverging format="money" />,
  },
  {
    id: "range",
    accessorFn: (row) => (row.price - row.low) / (row.high - row.low),
    header,
    size: 230,
    meta: { label: "52-week range" },
    cell: ({ row }) => <Range row={row.original} />,
  },
  {
    id: "weekly",
    header: "Weekly since April",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <Sparkline
        data={row.original.weekly}
        variant="line"
        color={row.original.since >= 0 ? "var(--positive)" : "var(--negative)"}
        animate={false}
        className="h-5 w-20"
      />
    ),
  },
  { accessorKey: "assetClass", header, size: 130, meta: { label: "Asset class" } },
];

function Table() {
  const losers = rows.filter((r) => r.gain < 0).toSorted((a, b) => a.gain - b.gain);
  const names = losers.map((r) => r.name);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {losers.length === 0
            ? "Every holding is up since April"
            : `${losers.length === 1 ? "One holding is" : `${losers.length} holdings are`} down since April: ${names.join(" and ")}`}
        </CardTitle>
        <CardDescription>
          Worth at the 27 Nov close, Friday's change and the gain since 31 Mar with money put in left out. A holding in
          the bottom tenth of its 52-week range is marked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={rows}
          columns={columns}
          initialState={{ sorting: [{ id: "worth", desc: true }], columnPinning: { start: ["name"], end: [] } }}
        >
          <DataTableToolbarSection>
            <DataTableFacetedFilter accessorKey="assetClass" title="Asset class" />
            <DataTableCompactColumnsToggle />
            <DataTableRowCount unit="holdings" />
          </DataTableToolbarSection>
          <DataTable aria-label="Every holding">
            <DataTableHeader />
            <DataTableBody getRowTone={tone} />
            <DataTableFootnote>
              Each gain's bar is its size against the largest; gains run right of the centre line, losses left. The
              range runs from the 52-week low to the high, the square at today's price.
            </DataTableFootnote>
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}

// --- The page. -----------------------------------------------------------------------------------------------------

// One number leads, and each section below explains it a level deeper: what it is made of, how it got here, how it
// did against the market and what the falls cost, then every holding.
export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="The Book"
        title="Portfolio"
        lead="What you own, what it is worth and why it moved."
        detail="Share prices at the 27 Nov 2026 close, 15:30 IST; fund values as published that evening."
      />
      <Headline />
      <PageSection title="What it is made of">
        <PanelGrid columns={1}>
          <Holdings />
          <Mix />
        </PanelGrid>
      </PageSection>
      <PageSection title="How it got here since April">
        <PanelGrid>
          <Bridge />
          <Days />
        </PanelGrid>
      </PageSection>
      <PageSection title="Against the market, and the falls on the way">
        <PanelGrid columns={1}>
          <Race />
          <Falls />
        </PanelGrid>
      </PageSection>
      <PageSection title="Every holding">
        <Table />
      </PageSection>
    </div>
  );
}
