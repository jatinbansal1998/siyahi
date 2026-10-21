import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableFacetedFilter,
  DataTableHeader,
  DataTableRoot,
  DataTableRowCount,
  DataTableSearchFilter,
  DataTableSortHeader,
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

// One click sorts largest (or Z) first; the title comes from meta.label.
const header = () => <DataTableSortHeader />;

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 140, meta: { label: "Symbol" } },
  { accessorKey: "sector", header, size: 120, meta: { label: "Sector" } },
  { accessorKey: "quantity", header, size: 100, meta: { label: "Qty", variant: "number" } },
  {
    accessorKey: "value",
    header,
    size: 140,
    meta: { label: "Value", variant: "number" },
    cell: ({ row }) => <Money amount={row.original.value} />,
  },
  {
    accessorKey: "change",
    header,
    size: 110,
    meta: { label: "Day", variant: "number" },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
];

export default function DataTableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>
          Search every column, filter by sector, sort any column in one click; the symbol stays put when the table
          scrolls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={holdings}
          columns={columns}
          initialState={{ columnPinning: { start: ["symbol"], end: [] } }}
        >
          <DataTableToolbarSection>
            <DataTableSearchFilter
              placeholder="Search holdings…"
              label="Filter holdings"
              className="flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="sector" title="Sector" />
            <DataTableRowCount unit="holdings" />
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
