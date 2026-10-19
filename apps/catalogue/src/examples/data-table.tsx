import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableColumnActions,
  DataTableColumnHeader,
  DataTableColumnSortOptions,
  DataTableColumnTitle,
  DataTableFacetedFilter,
  DataTableHeader,
  DataTableRoot,
  DataTableToolbarSection,
  Delta,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Holding {
  symbol: string;
  sector: string;
  quantity: number;
  value: number;
  change: number;
}

const holdings: Holding[] = [
  { symbol: "INFY", sector: "IT", quantity: 120, value: 224400, change: 0.018 },
  { symbol: "HDFCBANK", sector: "Banks", quantity: 150, value: 262500, change: -0.006 },
  { symbol: "TCS", sector: "IT", quantity: 40, value: 166000, change: 0.004 },
  { symbol: "ITC", sector: "FMCG", quantity: 600, value: 276000, change: -0.012 },
  { symbol: "ICICIBANK", sector: "Banks", quantity: 200, value: 258000, change: 0.022 },
  { symbol: "NIFTYBEES", sector: "ETF", quantity: 900, value: 255600, change: 0.009 },
];

const header = (title: string) => () => (
  <DataTableColumnHeader>
    <DataTableColumnTitle title={title} />
    <DataTableColumnActions>
      <DataTableColumnSortOptions />
    </DataTableColumnActions>
  </DataTableColumnHeader>
);

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header: header("Symbol"), size: 140, meta: { label: "Symbol" } },
  { accessorKey: "sector", header: header("Sector"), size: 120, meta: { label: "Sector" } },
  { accessorKey: "quantity", header: header("Qty"), size: 100, meta: { label: "Qty" } },
  {
    accessorKey: "value",
    header: header("Value"),
    size: 140,
    meta: { label: "Value" },
    cell: ({ row }) => <Money amount={row.original.value} />,
  },
  {
    accessorKey: "change",
    header: header("Day"),
    size: 110,
    meta: { label: "Day" },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
];

export default function DataTableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>
          Filter by sector, sort any column; the symbol stays put when the table scrolls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={holdings}
          columns={columns}
          initialState={{ columnPinning: { start: ["symbol"], end: [] } }}
        >
          <DataTableToolbarSection>
            <DataTableFacetedFilter accessorKey="sector" title="Sector" />
          </DataTableToolbarSection>
          <DataTable>
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
