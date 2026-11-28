import {
  BarChartCard,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChangeGrid,
  DataList,
  DataListItem,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  Delta,
  DrawdownChartCard,
  HistogramChartCard,
  PageHeader,
  PanelGrid,
  RangePosition,
  TimeSeriesChartCard,
  ToggleGroup,
  ToggleGroupItem,
  dataTableDetailsColumn,
  useFormat,
  type ChangeGridRow,
  type ChartSeries,
  type DataTableColumnDef,
  type TimeSeriesChartPane,
} from "@siyahi/ui";
import { BellIcon } from "lucide-react";
import { useMemo, useState } from "react";

// One made-up NSE share, Narmada Cement, and the Nifty 50 beside it, from November 2021 to the close on Friday 27
// November 2026. Each price walks a fixed sequence of random steps pinned to the levels below, so the page draws the
// same every time and every figure on it is worked out from these sessions.

interface Session {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceEvent {
  time: string;
  /** The note on the chart, lowercase and short enough to sit over a candle. */
  label: string;
  /** What the falls table says set a fall off, when the event did. */
  cause: string;
}

const EVENTS: PriceEvent[] = [
  { time: "2022-03-07", label: "coal prices double", cause: "Coal and pet coke doubled" },
  { time: "2023-10-09", label: "kiln 4 opens", cause: "Fourth kiln opened" },
  { time: "2024-01-30", label: "Q3 profit misses", cause: "Third-quarter profit missed" },
  { time: "2024-06-04", label: "election results", cause: "General election results" },
  { time: "2024-10-15", label: "price war in the south", cause: "Price war in south India" },
  { time: "2026-01-29", label: "Q3 profit misses", cause: "Third-quarter profit missed" },
  { time: "2026-07-24", label: "Q1 profit beats", cause: "First-quarter profit beat" },
  { time: "2026-10-30", label: "Q2 profit beats", cause: "Second-quarter profit beat" },
];

// Closes the walk passes through exactly. A pair a session apart is a jump on news: the walk adds nothing between them.
const SHARE_PATH: [string, number][] = [
  ["2021-11-01", 930],
  ["2022-01-14", 1060],
  ["2022-03-04", 1000],
  ["2022-03-07", 940],
  ["2022-06-17", 715],
  ["2022-12-30", 900],
  ["2023-05-31", 1000],
  ["2023-08-31", 1090],
  ["2023-10-06", 1160],
  ["2023-10-09", 1218],
  ["2024-01-29", 1410],
  ["2024-01-30", 1335],
  ["2024-03-04", 1300],
  ["2024-05-31", 1520],
  ["2024-06-03", 1580],
  ["2024-06-04", 1470],
  ["2024-07-31", 1600],
  ["2024-09-27", 1720],
  ["2024-10-14", 1660],
  ["2024-10-15", 1577],
  ["2025-02-28", 1330],
  ["2025-06-30", 1640],
  ["2025-09-30", 1830],
  ["2025-12-31", 1990],
  ["2026-01-28", 1960],
  ["2026-01-29", 1803],
  ["2026-03-13", 1750],
  ["2026-07-23", 2060],
  ["2026-07-24", 2142],
  ["2026-10-29", 2280],
  ["2026-10-30", 2417],
  ["2026-11-04", 2505],
  ["2026-11-26", 2374.95],
  ["2026-11-27", 2418.65],
];

const NIFTY_PATH: [string, number][] = [
  ["2021-11-01", 17900],
  ["2022-01-14", 18250],
  ["2022-06-17", 15300],
  ["2022-12-01", 18800],
  ["2023-03-28", 16950],
  ["2023-12-29", 21730],
  ["2024-06-03", 23260],
  ["2024-06-04", 21880],
  ["2024-09-27", 26200],
  ["2025-03-03", 22100],
  ["2025-06-30", 25500],
  ["2025-11-27", 26200],
  ["2026-03-13", 24600],
  ["2026-10-30", 26900],
  ["2026-11-27", 27150],
];

const DAYS = Array.from({ length: 1900 }, (_, i) => new Date(Date.UTC(2021, 10, 1 + i)))
  .filter((day) => ![0, 6].includes(day.getUTCDay()))
  .map((day) => day.toISOString().slice(0, 10))
  .filter((day) => day <= "2026-11-27");

function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function normal(next: () => number): number {
  return Math.sqrt(-2 * Math.log(next())) * Math.cos(2 * Math.PI * next());
}

/**
 * Daily closes through the pinned levels: a straight line between each pair in log terms plus a random walk that is
 * bent back to zero at every pinned day, so the walk wanders between them and lands on each exactly.
 */
function walk(path: [string, number][], dailySpread: number, seed: number): number[] {
  const next = random(seed);
  let level = 0;
  const noise = DAYS.map(() => (level += normal(next) * dailySpread));
  const pins = path.map(([day, close]) => ({ at: DAYS.indexOf(day), log: Math.log(close) }));
  return DAYS.map((_, i) => {
    const end = pins.findIndex((pin) => pin.at >= i);
    const b = pins[Math.max(end, 1)]!;
    const a = pins[Math.max(end, 1) - 1]!;
    const t = b.at === a.at ? 0 : (i - a.at) / (b.at - a.at);
    const bent = noise[i]! - (noise[a.at]! + t * (noise[b.at]! - noise[a.at]!));
    return Math.exp(a.log + t * (b.log - a.log) + bent);
  });
}

const shareCloses = walk(SHARE_PATH, 0.011, 17);
const niftyCloses = walk(NIFTY_PATH, 0.006, 29);

const sessions: Session[] = (() => {
  const next = random(5);
  return DAYS.map((time, i) => {
    const close = shareCloses[i]!;
    const previous = shareCloses[i - 1] ?? close;
    const open = previous * (1 + normal(next) * 0.004);
    const move = Math.abs(close / previous - 1);
    return {
      time,
      open,
      close,
      high: Math.max(open, close) * (1 + Math.abs(normal(next)) * 0.006),
      low: Math.min(open, close) * (1 - Math.abs(normal(next)) * 0.006),
      volume: Math.round(9_00_000 * (0.7 + next() * 0.5) * (1 + move * 60)),
    };
  });
})();

const last = sessions.at(-1)!;
const previous = sessions.at(-2)!;

/** The last session on or before the same day `months` months before the last one. */
function sessionBefore(months: number): number {
  const day = new Date(`${last.time}T00:00:00Z`);
  day.setUTCMonth(day.getUTCMonth() - months);
  const iso = day.toISOString().slice(0, 10);
  return DAYS.findLastIndex((candidate) => candidate <= iso);
}

const ret = (closes: number[], from: number) => closes.at(-1)! / closes[from]! - 1;
const yearly = (closes: number[], from: number, years: number) => (1 + ret(closes, from)) ** (1 / years) - 1;

interface PeriodReturn {
  period: string;
  share: number;
  nifty: number;
}

const PERIODS: PeriodReturn[] = (
  [
    ["1 month", 1],
    ["3 months", 3],
    ["6 months", 6],
    ["1 year", 12],
    ["3 years", 36],
    ["5 years", 60],
  ] as const
).map(([period, months]) => {
  const from = sessionBefore(months);
  const years = months / 12;
  return years > 1
    ? { period, share: yearly(shareCloses, from, years), nifty: yearly(niftyCloses, from, years) }
    : { period, share: ret(shareCloses, from), nifty: ret(niftyCloses, from) };
});

const yearAgo = sessionBefore(12);
const year = sessions.slice(yearAgo + 1);
const yearHigh = year.reduce((best, session) => (session.high > best.high ? session : best));
const yearLow = year.reduce((best, session) => (session.low < best.low ? session : best));

// Each session's close against the one before, over the last 250 sessions.
const dailyMoves = sessions.slice(-250).map((session, i, recent) => {
  const before = recent[i - 1] ?? sessions.at(-251)!;
  return session.close / before.close - 1;
});
const todayMove = last.close / previous.close - 1;
const calmerDays = dailyMoves.filter((move) => Math.abs(move) < Math.abs(todayMove)).length / dailyMoves.length;
const typicalMove = dailyMoves.map(Math.abs).toSorted((a, b) => a - b)[Math.floor(dailyMoves.length / 2)]!;
const volumeAverage = sessions.slice(-21, -1).reduce((sum, session) => sum + session.volume, 0) / 20;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Newest first, so a phone shows the recent years and scrolls to the older ones.
const YEARS = ["2026", "2025", "2024", "2023", "2022"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Months down the side and years across, so a row reads one month through the years.
const monthRows: ChangeGridRow[] = (() => {
  const monthEnd = new Map<string, number>();
  for (const session of sessions) monthEnd.set(session.time.slice(0, 7), session.close);
  const monthly = (yearLabel: string, month: number): number | null => {
    const key = `${yearLabel}-${String(month + 1).padStart(2, "0")}`;
    const before = new Date(Date.UTC(Number(yearLabel), month - 1, 1)).toISOString().slice(0, 7);
    const end = monthEnd.get(key);
    const start = monthEnd.get(before);
    return end === undefined || start === undefined ? null : end / start - 1;
  };
  return MONTHS.map((label, month) => {
    const values = YEARS.map((yearLabel) => monthly(yearLabel, month));
    const known = values.filter((value) => value !== null);
    return { label, values, total: known.reduce((sum, value) => sum + value, 0) / known.length };
  });
})();

interface Fall {
  depth: number;
  high: string;
  bottom: string;
  /** The first session back at the old high, or null while it is still below. */
  recovered: string | null;
  sessions: number;
  cause: string | null;
}

/** Every stretch below a previous high that fell more than 10%, deepest first, with the news that started it. */
const falls: Fall[] = (() => {
  const found: Fall[] = [];
  let peak = sessions[0]!;
  let trough = peak;
  sessions.forEach((session, i) => {
    if (session.close >= peak.close) {
      if (trough.close / peak.close - 1 < -0.1) {
        found.push(toFall(peak, trough, session.time, i - DAYS.indexOf(peak.time)));
      }
      peak = session;
      trough = session;
    } else if (session.close < trough.close) {
      trough = session;
    }
  });
  if (trough.close / peak.close - 1 < -0.1) {
    found.push(toFall(peak, trough, null, DAYS.length - 1 - DAYS.indexOf(peak.time)));
  }
  return found.toSorted((a, b) => a.depth - b.depth);
})();

function toFall(peak: Session, trough: Session, recovered: string | null, length: number): Fall {
  const news = EVENTS.find((event) => event.time > peak.time && event.time <= trough.time);
  return {
    depth: trough.close / peak.close - 1,
    high: peak.time,
    bottom: trough.time,
    recovered,
    sessions: length,
    cause: news?.cause ?? null,
  };
}

const yearTicks = YEARS.toReversed().map((label) => DAYS.find((day) => day.startsWith(label))!);

function useDay(): (iso: string) => string {
  const { dateTime } = useFormat();
  // A session is a day, not a moment: written in UTC it stays that day in every zone.
  return (iso) => dateTime(`${iso}T00:00:00Z`, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function useSigned(): (value: number, digits?: number) => string {
  const { pct } = useFormat();
  return (value, digits) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${pct(Math.abs(value), digits)}`;
}

function PriceChart() {
  const { money, count, pct } = useFormat();
  const [view, setView] = useState<"line" | "candles">("line");
  const fiveYear = last.close / shareCloses[sessionBefore(60)]!;
  const panes = useMemo<TimeSeriesChartPane[]>(
    () => [
      {
        series: [
          view === "line"
            ? {
                type: "area",
                label: "Close",
                color: "var(--chart-1)",
                data: sessions.map(({ time, close }) => ({ time, value: close })),
              }
            : { type: "candlestick", label: "Price", data: sessions },
        ],
        format: (value) => money(value, 2),
      },
      {
        height: 96,
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
    ],
    [view, money, count],
  );
  return (
    <TimeSeriesChartCard
      title={`Up ${pct(ret(shareCloses, yearAgo), 1)} in a year and ${fiveYear.toFixed(1)}× in five years`}
      description="Each session's close in ₹ and the shares traded, from November 2021. Arrows mark results days and the news behind the larger moves."
      panes={panes}
      events={EVENTS.map(({ time, label }) => ({ time, label }))}
      range="1Y"
      rangeToggle
      action={
        <ToggleGroup
          value={[view]}
          onValueChange={([next]) => next && setView(next === "candles" ? "candles" : "line")}
          variant="outline"
          size="sm"
          aria-label="Chart type"
        >
          <ToggleGroupItem value="line">Line</ToggleGroupItem>
          <ToggleGroupItem value="candles">Candles</ToggleGroupItem>
        </ToggleGroup>
      }
    />
  );
}

function YearRange() {
  const { money, count, pct } = useFormat();
  const day = useDay();
  const price = (value: number) => money(value, 2);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {pct(1 - last.close / yearHigh.high, 1)} under the 52-week high it set on {day(yearHigh.time)}
        </CardTitle>
        <CardDescription>
          Today's close on a track from the lowest to the highest price of the last 52 weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          <RangePosition
            low={yearLow.low}
            high={yearHigh.high}
            value={last.close}
            lowLabel={`Low, ${day(yearLow.time)}`}
            highLabel="High"
            caption="of the way up the 52-week range"
            valueFormatter={price}
          />
          <DataList>
            <DataListItem label="Today's range">
              <RangePosition
                variant="compact"
                low={last.low}
                high={last.high}
                value={last.close}
                lowLabel="Today's low"
                highLabel="Today's high"
                valueFormatter={price}
              />
            </DataListItem>
            <DataListItem label="Shares traded today">
              {count(last.volume)}, {(last.volume / volumeAverage).toFixed(1)}× the average of the last 20 sessions
            </DataListItem>
          </DataList>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyMoves() {
  const { pct } = useFormat();
  const signed = useSigned();
  const spread = Math.max(...dailyMoves) - Math.min(...dailyMoves);
  return (
    <HistogramChartCard
      bins={Math.round(spread / 0.005)}
      title={`Today's ${signed(todayMove, 1)} was larger than ${pct(calmerDays, 0)} of the year's daily moves`}
      description={`Each session's change on the close before, over the last 250 sessions, counted in half-point buckets. Half the sessions moved less than ${pct(typicalMove, 1)} either way.`}
      values={dailyMoves}
      valueFormatter={(value) => signed(value, 1)}
      countLabel="Sessions"
      xLabel="Change on the day"
      yLabel="Sessions"
    />
  );
}

const returnSeries: ChartSeries<PeriodReturn> = [
  { key: "share", label: "Narmada Cement", color: "var(--chart-1)" },
  { key: "nifty", label: "Nifty 50", color: "var(--muted-foreground)" },
];

/** How many points the share is ahead of the index, signed: "+18.0". */
function pointsAhead(row: PeriodReturn): string {
  const gap = (row.share - row.nifty) * 100;
  return `${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap).toFixed(1)}`;
}

function Returns() {
  const signed = useSigned();
  const behind = PERIODS.filter((row) => row.share < row.nifty).map((row) => row.period);
  const title =
    behind.length === 0
      ? "Ahead of the Nifty 50 over every period"
      : behind.length === 1
        ? `Ahead of the Nifty 50 over every period but ${behind[0]}`
        : `Ahead of the Nifty 50 over ${PERIODS.length - behind.length} of ${PERIODS.length} periods`;
  return (
    <BarChartCard
      title={title}
      description="Price change to today's close, dividends left out; 3 and 5 years as a yearly rate. Under each period, how many points the share is ahead of the index."
      data={PERIODS}
      xKey="period"
      xTickDetail={pointsAhead}
      series={returnSeries}
      valueFormatter={(value) => signed(value, 1)}
      yTickFormatter={(value) => signed(value, 0)}
      horizontal
      // Lined up with the months beside it.
      height={420}
    />
  );
}

function Months() {
  const { pct } = useFormat();
  const ranked = monthRows.map((row, month) => ({ ...row, name: MONTH_NAMES[month]! }));
  ranked.sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
  const weakest = ranked[0]!;
  const strongest = ranked.at(-1)!;
  const downYears = weakest.values.filter((value) => value !== null && value < 0).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {weakest.name} has fallen in {downYears} of the last {YEARS.length} years, {strongest.name} has gained{" "}
          {pct(strongest.total ?? 0, 1)} on average
        </CardTitle>
        <CardDescription>
          Each month's change on the month before, close to close; November 2026 runs to the 27th. Deeper tints are
          larger moves.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid label="Monthly change by year" columns={YEARS} rows={monthRows} totalLabel="Average" />
      </CardContent>
    </Card>
  );
}

function Falls() {
  const { money, pct } = useFormat();
  const day = useDay();
  const deepest = falls[0]!;
  return (
    <DrawdownChartCard
      title={`Its deepest fall took ${pct(-deepest.depth, 1)} off and ${Math.round(deepest.sessions / 21)} months to win back`}
      description="Each session's close against the highest close before it. At zero the share was at a new high."
      data={sessions}
      xKey="time"
      levelKey="close"
      levelFormatter={(value) => money(value, 2)}
      label="Below its high"
      xFormatter={(iso) => iso.slice(0, 4)}
      xTooltipFormatter={day}
      xTicks={yearTicks}
    />
  );
}

function FallDepth({ fall }: { fall: Fall }) {
  return useSigned()(fall.depth, 1);
}

function FallDay({ iso }: { iso: string | null }) {
  const day = useDay();
  return iso ? day(iso) : "Not yet";
}

const header = () => <DataTableSortHeader />;

const fallColumns: DataTableColumnDef<Fall>[] = [
  dataTableDetailsColumn<Fall>(),
  {
    accessorKey: "depth",
    header,
    size: 80,
    meta: { label: "Fall", variant: "number", compact: true },
    cell: ({ row }) => <FallDepth fall={row.original} />,
  },
  {
    accessorKey: "cause",
    header,
    size: 200,
    meta: { label: "What set it off", compact: true },
    cell: ({ row }) => row.original.cause ?? "—",
  },
  {
    accessorKey: "high",
    header,
    size: 110,
    meta: { label: "Began" },
    cell: ({ row }) => <FallDay iso={row.original.high} />,
  },
  {
    accessorKey: "bottom",
    header,
    size: 110,
    meta: { label: "Bottom" },
    cell: ({ row }) => <FallDay iso={row.original.bottom} />,
  },
  {
    accessorKey: "recovered",
    header,
    size: 130,
    meta: { label: "Recovered" },
    cell: ({ row }) => <FallDay iso={row.original.recovered} />,
  },
];

function FallsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The falls of more than 10% and what set them off</CardTitle>
        <CardDescription>
          From a closing high to the lowest close before the share got back to it, deepest first
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={falls} columns={fallColumns}>
          <DataTable aria-label="Falls of more than 10%">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}

// The chart is the page: the price and the day's move head it, the chart leads, and each block after it answers the
// next thing a reader of the chart asks, in order: where it sits now, whether today was a big day, whether it beat
// the market, how its months go, and how far it has fallen and why.
export default function InstrumentPage() {
  const { money } = useFormat();
  const day = useDay();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Narmada Cement · NSE: NARMADACEM"
        title={money(last.close, 2)}
        lead={
          <>
            <Delta value={todayMove} /> today, from {money(previous.close, 2)} at the last close.
          </>
        }
        detail={`Prices as of the close on ${day(last.time)}, 15:30 IST. Made-up figures.`}
        actions={
          <Button variant="outline">
            <BellIcon />
            Set a price alert
          </Button>
        }
      />
      <PriceChart />
      <PanelGrid>
        <YearRange />
        <DailyMoves />
        <Returns />
        <Months />
        <Falls />
        <FallsTable />
      </PanelGrid>
    </div>
  );
}
