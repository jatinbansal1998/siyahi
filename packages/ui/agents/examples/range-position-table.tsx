import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableCompactColumnsToggle,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  DataTableToolbarSection,
  RangePosition,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Holding {
  symbol: string;
  /** Last close and the 52-week low and high closes, in rupees; made-up figures. */
  close: number;
  low: number;
  high: number;
  /** How far up its range the close sits, 0 at the low and 1 at the high, so the column sorts. */
  position: number;
}

const holding = (symbol: string, close: number, low: number, high: number): Holding => ({
  symbol,
  close,
  low,
  high,
  position: (close - low) / (high - low),
});

const holdings: Holding[] = [
  holding("NIFTYBEES", 284, 241.2, 291.8),
  holding("INFY", 1870, 1307, 2006.45),
  holding("ICICIBANK", 1290, 1051.05, 1362.35),
  holding("TCS", 4150, 3591.5, 4592.25),
  holding("ITC", 460, 399.35, 528.5),
  holding("HDFCBANK", 1750, 1613.6, 2027.4),
];

function Price({ amount }: { amount: number }) {
  return useFormat().money(amount, 2);
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 130, meta: { label: "Symbol", compact: true } },
  {
    accessorKey: "close",
    header,
    size: 120,
    meta: { label: "Close", variant: "number" },
    cell: ({ row }) => <Price amount={row.original.close} />,
  },
  {
    accessorKey: "position",
    header,
    size: 200,
    meta: { label: "52-week range", compact: true },
    cell: ({ row }) => (
      <RangePosition
        variant="compact"
        low={row.original.low}
        high={row.original.high}
        value={row.original.close}
        lowLabel="52-week low"
        highLabel="52-week high"
      />
    ),
  },
];

export default function RangePositionTableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>NIFTYBEES trades near its 52-week high, HDFCBANK near its low</CardTitle>
        <CardDescription>
          Each close on a track from the year's low close to its high; sort to rank them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={holdings} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
          </DataTableToolbarSection>
          <DataTable aria-label="Holdings in their 52-week range">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
