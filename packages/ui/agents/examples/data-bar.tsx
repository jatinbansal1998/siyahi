import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataBar,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  Sparkline,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Holding {
  symbol: string;
  value: number;
  gain: number;
  /** Closing prices over the last ten sessions, oldest first. */
  closes: number[];
}

const holdings: Holding[] = [
  { symbol: "ITC", value: 276000, gain: -18400, closes: [478, 474, 470, 471, 466, 463, 465, 461, 459, 460] },
  {
    symbol: "HDFCBANK",
    value: 262500,
    gain: 21300,
    closes: [1712, 1718, 1726, 1720, 1731, 1744, 1739, 1748, 1752, 1750],
  },
  {
    symbol: "ICICIBANK",
    value: 258000,
    gain: 44100,
    closes: [1250, 1262, 1258, 1271, 1266, 1280, 1284, 1279, 1288, 1290],
  },
  { symbol: "NIFTYBEES", value: 255600, gain: 12800, closes: [281, 282, 280, 283, 284, 283, 285, 284, 286, 284] },
  { symbol: "INFY", value: 224400, gain: 30900, closes: [1820, 1834, 1829, 1841, 1852, 1848, 1860, 1855, 1866, 1870] },
  { symbol: "TCS", value: 166000, gain: -2600, closes: [4180, 4172, 4165, 4170, 4158, 4150, 4161, 4155, 4148, 4150] },
];

// Each bar is a share of its column's largest figure, so the rows draw to one scale.
const largestValue = Math.max(...holdings.map((h) => h.value));
const largestGain = Math.max(...holdings.map((h) => Math.abs(h.gain)));

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 120, meta: { label: "Symbol" } },
  {
    accessorKey: "value",
    header,
    size: 170,
    meta: { label: "Value", variant: "number" },
    cell: ({ row }) => (
      <DataBar value={row.original.value} max={largestValue}>
        <Money amount={row.original.value} />
      </DataBar>
    ),
  },
  {
    accessorKey: "gain",
    header,
    size: 170,
    meta: { label: "Gain", variant: "number" },
    cell: ({ row }) => (
      <DataBar value={row.original.gain} max={largestGain} tone="sign">
        <Money amount={row.original.gain} />
      </DataBar>
    ),
  },
  {
    id: "closes",
    header: "10 days",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => {
      const { closes } = row.original;
      const rising = (closes.at(-1) ?? 0) >= (closes[0] ?? 0);
      return (
        <Sparkline
          data={closes}
          variant="line"
          color={rising ? "var(--positive)" : "var(--negative)"}
          animate={false}
          className="h-5 w-20"
        />
      );
    },
  },
];

export default function DataBarExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Bars give each figure's size against the column's largest</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={holdings}
          columns={columns}
          initialState={{ columnPinning: { start: ["symbol"], end: [] } }}
        >
          <DataTable>
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
