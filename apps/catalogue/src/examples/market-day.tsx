import {
  BarChartCard,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChangeGrid,
  DataBar,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  Delta,
  DistributionBar,
  HistogramChartCard,
  MetricStrip,
  PageHeader,
  PanelGrid,
  PageSection,
  TimeSeriesChartCard,
  WaterfallChartCard,
  dataTableDetailsColumn,
  signed,
  useDataTable,
  useFormat,
  type ChangeGridRow,
  type ChartSeries,
  type DataTableColumnDef,
  type MetricStripItem,
  type TimeSeriesChartPane,
  type WaterfallStep,
} from "@siyahi/ui";

// One made-up session on the NSE, Friday 27 Nov 2026: the Nifty fell while most stocks rose, because the largest
// banks fell. Every block answers the question the one before it raises. All figures are invented.

// ---------------------------------------------------------------------------------------------------------------
// Where the indices closed. Each run is the 30 Oct close, then every session in November to today; the market was
// shut on 10 Nov (Diwali Balipratipada) and 24 Nov (Guru Nanak Jayanti).

interface IndexClose {
  name: string;
  closes: number[];
}

const indices: IndexClose[] = [
  {
    name: "Nifty 50",
    closes: [
      24180, 24262, 24318, 24205, 24371, 24440, 24398, 24512, 24605, 24570, 24688, 24790, 24880, 24742, 24655, 24538,
      24470, 24415.3, 24312.45,
    ],
  },
  {
    name: "Sensex",
    closes: [
      79480, 79740, 79915, 79560, 80090, 80310, 80170, 80540, 80850, 80730, 81120, 81460, 81745, 81290, 81010, 80620,
      80390, 80262.1, 79884.2,
    ],
  },
  {
    name: "Bank Nifty",
    closes: [
      51620, 51880, 52040, 51790, 52260, 52510, 52430, 52790, 53140, 53020, 53380, 53610, 53820, 53450, 53190, 52960,
      52880, 52795.6, 52104.35,
    ],
  },
  {
    name: "Nifty IT",
    closes: [
      36420, 36510, 36690, 36580, 36740, 36810, 36920, 36880, 37020, 37110, 37060, 37190, 37240, 37150, 37080, 37210,
      37290, 37179.5, 37410.1,
    ],
  },
  {
    name: "Nifty Next 50",
    closes: [
      65410, 65590, 65720, 65480, 65860, 66010, 65940, 66230, 66480, 66390, 66620, 66840, 67010, 66780, 66650, 66520,
      66610, 66693.2, 66920.4,
    ],
  },
  {
    name: "Midcap 150",
    closes: [
      20180, 20240, 20310, 20210, 20380, 20450, 20410, 20530, 20620, 20590, 20680, 20760, 20810, 20690, 20620, 20580,
      20590, 20638.1, 20815.6,
    ],
  },
  {
    name: "Smallcap 250",
    closes: [
      15820, 15870, 15940, 15810, 15990, 16080, 16030, 16140, 16230, 16190, 16270, 16350, 16390, 16240, 16170, 16120,
      16150, 16221.1, 16402.75,
    ],
  },
];

// The fear gauge rises when the market falls, so its rise is bad news.
const vix = [
  13.2, 13.05, 12.88, 13.4, 12.95, 12.7, 12.82, 12.55, 12.4, 12.62, 12.35, 12.1, 11.98, 12.6, 13.05, 13.42, 13.7, 13.97,
  14.82,
];

const lastTwo = (closes: number[]) => [closes.at(-2) ?? 0, closes.at(-1) ?? 0] as const;

function Indices() {
  const { fixed } = useFormat();
  const items: MetricStripItem[] = indices.map(({ name, closes }) => {
    const [before, close] = lastTwo(closes);
    return {
      label: name,
      // An index level as exchanges quote it: 24,312.45.
      value: fixed(close),
      change: close / before - 1,
      trend: closes,
      // The one index the day turned on, marked by the page.
      tone: name === "Bank Nifty" ? "negative" : undefined,
    };
  });
  const [vixBefore, vixClose] = lastTwo(vix);
  items.push({
    label: "India VIX",
    value: fixed(vixClose),
    change: vixClose / vixBefore - 1,
    rise: "bad",
    trend: vix,
  });
  return (
    <MetricStrip
      title="Large caps fell; mid and small caps rose"
      description="Each index's close today and its change on Thursday's. Lines run from the 30 Oct close."
      items={items}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------
// When it happened: each index's move from Thursday's close, every 5 minutes from 09:15 to 15:30 IST.

const OPEN = Date.UTC(2026, 10, 27, 3, 45) / 1000;
const SAMPLES = 76;

/** Joins [minute after the open, move from Thursday's close] points into 5-minute samples, with a little noise. */
function session(points: [minute: number, move: number][], seed: number): number[] {
  return Array.from({ length: SAMPLES }, (_, i) => {
    const minute = i * 5;
    const after = points.findIndex(([at]) => at >= minute);
    const [m1, v1] = points[Math.max(0, after - 1)] ?? [0, 0];
    const [m2, v2] = points[after] ?? [m1, v1];
    const along = m2 === m1 ? 0 : (minute - m1) / (m2 - m1);
    const noise = i === SAMPLES - 1 ? 0 : 0.0004 * Math.sin(i * 1.7 + seed) + 0.0003 * Math.sin(i * 0.6 + seed * 2);
    return v1 + (v2 - v1) * along + noise;
  });
}

const intraday = [
  {
    label: "Midcap 150",
    color: "var(--chart-3)",
    moves: session(
      [
        [0, 0.003],
        [60, 0.0062],
        [135, 0.0095],
        [255, 0.0118],
        [290, 0.0102],
        [330, 0.0071],
        [360, 0.0084],
        [375, 0.0086],
      ],
      1,
    ),
  },
  {
    label: "Nifty 50",
    color: "var(--chart-1)",
    moves: session(
      [
        [0, 0.0015],
        [30, 0.0028],
        [135, 0.0036],
        [255, 0.0022],
        [290, -0.0018],
        [330, -0.0055],
        [360, -0.0038],
        [375, -0.0042],
      ],
      2,
    ),
  },
  {
    label: "Bank Nifty",
    color: "var(--chart-2)",
    moves: session(
      [
        [0, 0.001],
        [30, 0.0026],
        [135, 0.0031],
        [255, 0.0012],
        [290, -0.0055],
        [330, -0.0152],
        [360, -0.0124],
        [375, -0.0131],
      ],
      3,
    ),
  },
] as const;

function Session() {
  const { pct } = useFormat();
  const signedPct = (value: number) => signed(value, (size) => pct(size, 2));
  const panes: TimeSeriesChartPane[] = [
    {
      series: intraday.map(({ label, color, moves }) => ({
        label,
        color,
        data: moves.map((value, i) => ({ time: OPEN + i * 300, value })),
      })),
      levels: [{ value: 0, label: "Thursday's close" }],
      format: signedPct,
    },
  ];
  return (
    <TimeSeriesChartCard
      title="Banks turned the Nifty down after 14:00; mid caps kept most of their gain"
      description="Each index's move from Thursday's close, every 5 minutes, in IST"
      panes={panes}
      events={[{ time: OPEN + 290 * 60, label: "banks sold" }]}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------
// How broad it was: stocks that closed up and down in each index, then how far the typical stock moved.

interface Breadth {
  index: string;
  rose: number;
  fell: number;
  unchanged: number;
}

const breadth: Breadth[] = [
  { index: "Nifty 50", rose: 21, fell: 29, unchanged: 0 },
  { index: "Nifty Next 50", rose: 31, fell: 18, unchanged: 1 },
  { index: "Midcap 150", rose: 101, fell: 47, unchanged: 2 },
  { index: "Smallcap 250", rose: 172, fell: 74, unchanged: 4 },
  { index: "Every NSE stock", rose: 1986, fell: 1012, unchanged: 94 },
];

function BreadthRows() {
  const { count } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two stocks rose for every one that fell, outside the Nifty 50</CardTitle>
        <CardDescription>
          Stocks that closed up, on the left, and down, on the right, in each index today. The tick marks half.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-5">
          {breadth.map(({ index, rose, fell, unchanged }) => {
            const total = rose + fell + unchanged;
            return (
              <li key={index} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span>{index}</span>
                  <span className="text-sm text-muted-foreground">
                    {count(rose)} rose · {count(fell)} fell
                  </span>
                </div>
                <DistributionBar
                  showLegend={false}
                  max={1}
                  markers={[{ at: 0.5 }]}
                  aria-label={`${index}: ${count(rose)} rose, ${count(fell)} fell, ${count(unchanged)} unchanged`}
                  segments={[
                    { name: "Rose", value: rose / total, color: "var(--positive)" },
                    { name: "Unchanged", value: unchanged / total, color: "var(--muted)" },
                    { name: "Fell", value: fell / total, color: "var(--negative)" },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// Each Nifty 500 stock's change today, from a fixed sequence so the page draws the same every time: 60 banks and
// lenders clustered below zero, the rest spread above it.
let seed = 11;
const uniform = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const normal = (mean: number, spread: number) =>
  mean + spread * Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
const moves = [
  ...Array.from({ length: 60 }, () => normal(-0.013, 0.008)),
  ...Array.from({ length: 440 }, () => normal(0.009, 0.015)),
];
const median = moves.toSorted((a, b) => a - b)[moves.length / 2] ?? 0;

function Spread() {
  const { pct } = useFormat();
  return (
    <HistogramChartCard
      title={`The median Nifty 500 stock rose ${pct(median)}`}
      description="Each Nifty 500 stock's change today, counted in buckets of half a point. Half the stocks did better than the median, half worse."
      values={moves}
      bins={16}
      valueFormatter={(value) => signed(value, pct)}
      countLabel="Stocks"
      marks={[{ value: 0, label: "zero" }, "median"]}
      xLabel="Change today"
      yLabel="Stocks"
      height={300}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Why the index fell anyway: each stock's share of the Nifty's move, in index points. The five largest banks
// weigh about a third of the index.

const contributions: WaterfallStep[] = [
  { kind: "change", label: "Tapti Bank", value: -46.2 },
  { kind: "change", label: "Chenab Bank", value: -28.4 },
  { kind: "change", label: "Sutlej Bank", value: -11.8 },
  { kind: "change", label: "Mahanadi Bank", value: -9.6 },
  { kind: "change", label: "Teesta Bank", value: -7.1 },
  { kind: "change", label: "Konkan Industries", value: 9.4 },
  { kind: "change", label: "Mahi Pharma", value: 5.8 },
  { kind: "change", label: "Barak Steel", value: 5.1 },
  { kind: "change", label: "Sone Metals", value: 4.6 },
  { kind: "change", label: "Sindhu Engineering", value: 3.7 },
  { kind: "change", label: "The other 40 stocks", value: -28.35 },
  { kind: "total", label: "Nifty 50" },
];

function Contributions() {
  const { fixed, number } = useFormat();
  return (
    <WaterfallChartCard
      title="Five banks took 103 points off the Nifty, more than its whole fall"
      description="What each stock added to or took from the Nifty 50 between Thursday's close and today's, in index points"
      steps={contributions}
      horizontal
      labels={{ rise: "Added", fall: "Took away", total: "The Nifty's move" }}
      valueFormatter={(value) => fixed(value, 1)}
      yTickFormatter={(value) => signed(value, number)}
      height={contributions.length * 40 + 64}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Which sectors led and lagged: each NSE sector index today, this week and this month, as a grid of identical cells
// so a sector's run reads across and the day's order reads down.

interface Sector {
  sector: string;
  today: number;
  week: number;
  month: number;
}

const sectors: Sector[] = [
  { sector: "Metal", today: 0.0184, week: 0.0412, month: 0.0638 },
  { sector: "Realty", today: 0.0162, week: 0.0215, month: 0.0344 },
  { sector: "Pharma", today: 0.0121, week: 0.0187, month: 0.0291 },
  { sector: "IT", today: 0.0062, week: 0.0094, month: 0.0272 },
  { sector: "Media", today: 0.0058, week: -0.0042, month: -0.0118 },
  { sector: "Auto", today: 0.0041, week: 0.0063, month: 0.0185 },
  { sector: "FMCG", today: 0.0022, week: -0.0031, month: 0.0046 },
  { sector: "Energy", today: 0.0015, week: 0.0028, month: 0.0102 },
  { sector: "Oil and gas", today: -0.0012, week: -0.0009, month: 0.0071 },
  { sector: "PSU bank", today: -0.0038, week: -0.0115, month: 0.0124 },
  { sector: "Financials", today: -0.0108, week: -0.0196, month: 0.0058 },
  { sector: "Bank", today: -0.0131, week: -0.0242, month: 0.0094 },
  { sector: "Private bank", today: -0.0146, week: -0.0271, month: 0.0062 },
];

const sectorRows: ChangeGridRow[] = sectors.map(({ sector, today, week, month }) => ({
  label: sector,
  values: [today, week, month],
}));

function Sectors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Private banks fell most; metals rose most, to a 52-week high</CardTitle>
        <CardDescription>
          Each NSE sector index, best day first. Tints deepen up to a 3% move, so a day and a month read on one scale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid
          label="Sector indices today, this week and this month"
          columns={["Today", "This week", "This month"]}
          rows={sectorRows}
          range={0.03}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Who bought and sold: foreign and domestic institutions' net buying in the cash market each session, ₹ crore,
// NSE's provisional figures.

interface Flow {
  date: string;
  foreign: number;
  domestic: number;
}

const sessions = [
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
  "2026-11-09",
  "2026-11-11",
  "2026-11-12",
  "2026-11-13",
  "2026-11-16",
  "2026-11-17",
  "2026-11-18",
  "2026-11-19",
  "2026-11-20",
  "2026-11-23",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
];
const foreign = [
  -1240, -2310, 860, -3120, -1980, -450, -2760, 1120, -1890, -3340, -2050, 640, -1510, -2480, -1930, -2870, -3010,
  -3412,
];
const domestic = [
  1520, 2840, -310, 3460, 2210, 980, 2950, -420, 2280, 3610, 2390, 210, 1880, 2760, 2140, 3150, 3320, 4186,
];
const CRORE = 1_00_00_000;
const flows: Flow[] = sessions.map((date, i) => ({ date, foreign: foreign[i] ?? 0, domestic: domestic[i] ?? 0 }));
const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

// Money moving is not a gain or a loss, so the two buyers take chart colours, not green and red.
const flowSeries: ChartSeries<Flow> = [
  { key: "foreign", label: "Foreign investors", color: "var(--chart-1)" },
  { key: "domestic", label: "Domestic institutions", color: "var(--chart-2)" },
];

function Flows() {
  const { count, moneyCompact, dateTime } = useFormat();
  const crore = (value: number) => signed(value, count);
  const rupees = (value: number) => signed(value * CRORE, (size) => moneyCompact(size));
  return (
    <BarChartCard
      title="Foreign investors sold for a sixth session; domestic institutions bought more than they sold"
      description="Each session's net buying in the cash market, ₹ crore: buying above the line, selling below it. NSE's provisional figures."
      data={flows}
      xKey="date"
      series={flowSeries}
      xTicks={["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]}
      xFormatter={(date) => dateTime(date, { day: "numeric", month: "short" })}
      xTooltipFormatter={(date) =>
        dateTime(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      }
      valueFormatter={crore}
      height={300}
      footer={
        <p className="text-muted-foreground">
          November so far: foreign investors {rupees(total(foreign))}, domestic institutions {rupees(total(domestic))}.
        </p>
      }
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------
// What stands out: Nifty 500 stocks with a large move on unusual volume.

interface Standout {
  stock: string;
  change: number;
  /** Shares traded today against the 20-day average. */
  volume: number;
  note: string;
}

const standouts: Standout[] = [
  { stock: "Tapti Bank", change: -0.029, volume: 3.6, note: "lowest close since August" },
  { stock: "Chenab Bank", change: -0.024, volume: 2.7, note: "below its 200-day average" },
  { stock: "Sone Metals", change: 0.034, volume: 2.8, note: "52-week high" },
  { stock: "Kosi Stores", change: 0.078, volume: 4.9, note: "52-week high" },
  { stock: "Barak Steel", change: 0.026, volume: 2.1, note: "fifth day up" },
  { stock: "Mahi Pharma", change: 0.021, volume: 1.9, note: "52-week high" },
];

const largestVolume = Math.max(...standouts.map((s) => s.volume));

function Times({ value }: { value: number }) {
  return useFormat().multiple(value);
}

// While "why it stands out" is hidden to fit, it rides under the stock's name.
function StockCell({ standout }: { standout: Standout }) {
  const { compactColumns } = useDataTable<Standout>();
  if (!compactColumns?.hidden.has("note")) return standout.stock;
  return (
    <div className="flex flex-col">
      {standout.stock}
      <span className="text-muted-foreground">{standout.note}</span>
    </div>
  );
}

const header = () => <DataTableSortHeader />;

const standoutColumns: DataTableColumnDef<Standout>[] = [
  dataTableDetailsColumn<Standout>(),
  {
    accessorKey: "stock",
    header,
    size: 120,
    meta: { label: "Stock", compact: true },
    cell: ({ row }) => <StockCell standout={row.original} />,
  },
  {
    accessorKey: "change",
    header,
    size: 90,
    meta: { label: "Today", variant: "number", compact: true },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
  { accessorKey: "note", header, size: 200, enableSorting: false, meta: { label: "Why it stands out" } },
  {
    accessorKey: "volume",
    header,
    size: 150,
    meta: { label: "Volume against usual", variant: "number" },
    cell: ({ row }) => (
      <DataBar value={row.original.volume} max={largestVolume}>
        <Times value={row.original.volume} />
      </DataBar>
    ),
  },
];

function Standouts() {
  const { multiple } = useFormat();
  const busiest = standouts.reduce((a, b) => (b.volume > a.volume ? b : a));
  const highs = standouts.filter((s) => s.note === "52-week high").length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {busiest.stock} traded {multiple(busiest.volume)} its usual volume; {highs} stocks hit 52-week highs
        </CardTitle>
        <CardDescription>
          Nifty 500 stocks that moved 1.9% or more on at least 1.9 times their usual volume. Volume is today's shares
          traded against the average of the last 20 sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={standouts} columns={standoutColumns}>
          <DataTable aria-label="Stocks that stand out today">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------------------------

// The page a trader opens after the close. One sentence says what kind of day it was; the indices say where they
// ended and the session chart when it turned. Each section then asks the question that raises, and its blocks'
// titles answer it: how broad the move was, what pulled the index down, who sold and what to look at next.
export default function MarketDay() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dash · Market close"
        title="The Nifty fell 0.4% while most stocks rose"
        lead="Five banks pulled the large-cap indices down after 14:00; mid and small caps closed higher, and two stocks rose for every one that fell."
        detail="NSE closing figures for Friday 27 Nov 2026, 15:30 IST."
      />
      <div className="flex flex-col gap-4">
        <Indices />
        <Session />
      </div>
      <PageSection title="How broad was the move?">
        <PanelGrid>
          <BreadthRows />
          <Spread />
        </PanelGrid>
      </PageSection>
      <PageSection title="What pulled the Nifty down?">
        <PanelGrid>
          <Contributions />
          <Sectors />
        </PanelGrid>
      </PageSection>
      <PageSection title="Who sold, and what stands out?">
        <PanelGrid>
          <Flows />
          <Standouts />
        </PanelGrid>
      </PageSection>
    </div>
  );
}
