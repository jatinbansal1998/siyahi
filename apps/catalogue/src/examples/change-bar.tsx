import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChangeBar,
  DataTable,
  DataTableBody,
  DataTableCompactColumnsToggle,
  DataTableFootnote,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  DataTableToolbarSection,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Holding {
  symbol: string;
  /** Value at the close of 31 January and of 28 February, in rupees; made-up figures. */
  january: number;
  february: number;
  change: number;
}

const holding = (symbol: string, january: number, february: number): Holding => ({
  symbol,
  january,
  february,
  change: february / january - 1,
});

const holdings: Holding[] = [
  holding("ICICIBANK", 231900, 258000),
  holding("HDFCBANK", 248300, 262500),
  holding("TCS", 161300, 166000),
  holding("NIFTYBEES", 250400, 255600),
  holding("ITC", 283100, 276000),
  holding("INFY", 241800, 224400),
];

// Every bar is a share of the column's largest move, and the column holds gains and losses, so the bars diverge.
const largestChange = Math.max(...holdings.map((h) => Math.abs(h.change)));
const diverging = holdings.some((h) => h.change < 0) && holdings.some((h) => h.change > 0);

function Money({ amount, muted = false }: { amount: number; muted?: boolean }) {
  const text = useFormat().money(amount);
  return muted ? <span className="text-muted-foreground">{text}</span> : text;
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 130, meta: { label: "Holding", compact: true } },
  {
    accessorKey: "january",
    header,
    size: 130,
    meta: { label: "31 Jan", variant: "number" },
    cell: ({ row }) => <Money amount={row.original.january} muted />,
  },
  {
    accessorKey: "february",
    header,
    size: 130,
    meta: { label: "28 Feb", variant: "number", compact: true },
    cell: ({ row }) => <Money amount={row.original.february} />,
  },
  {
    accessorKey: "change",
    header,
    size: 150,
    meta: { label: "Change", variant: "number", compact: true },
    cell: ({ row }) => <ChangeBar value={row.original.change} max={largestChange} diverging={diverging} />,
  },
];

export default function ChangeBarExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ICICIBANK rose 11.3% in February, INFY fell 7.2%</CardTitle>
        <CardDescription>Each holding's value at the end of February against the end of January</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={holdings} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
          </DataTableToolbarSection>
          <DataTable aria-label="February against January">
            <DataTableHeader />
            <DataTableBody />
            <DataTableFootnote>
              Each percent is the change on January's value, and the bar is its size against the largest move. Gains run
              right of the centre line, losses left.
            </DataTableFootnote>
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
