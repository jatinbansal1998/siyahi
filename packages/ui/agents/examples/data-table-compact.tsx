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
  DataTableRowCount,
  DataTableSortHeader,
  DataTableToolbarSection,
  Delta,
  useDataTable,
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
  { symbol: "ITC", sector: "Fast Moving Consumer Goods", quantity: 600, value: 276000, change: -0.012 },
];

const header = () => <DataTableSortHeader />;

// While the Day column is hidden to fit, the day's move rides under the value it belongs to.
function ValueCell({ holding }: { holding: Holding }) {
  const format = useFormat();
  const { compactColumns } = useDataTable<Holding>();
  if (!compactColumns?.hidden.has("change")) return format.money(holding.value);
  return (
    <div className="flex flex-col items-end">
      {format.money(holding.value)}
      <Delta value={holding.change} />
    </div>
  );
}

const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 140, meta: { label: "Symbol", compact: true } },
  { accessorKey: "sector", header, size: 120, meta: { label: "Sector" } },
  { accessorKey: "quantity", header, size: 100, meta: { label: "Qty", variant: "number" } },
  {
    accessorKey: "value",
    header,
    size: 140,
    meta: { label: "Value", variant: "number", compact: true },
    cell: ({ row }) => <ValueCell holding={row.original} />,
  },
  {
    accessorKey: "change",
    header,
    size: 110,
    meta: { label: "Day", variant: "number" },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
];

export default function DataTableCompactExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings on a phone</CardTitle>
        <CardDescription>
          Symbol and value are the key columns. When the columns do not fit, the others hide from the right, and the
          day's move rides under the value once its column is gone; All columns brings back the rest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={holdings} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
            <DataTableRowCount unit="holdings" />
          </DataTableToolbarSection>
          <DataTable aria-label="Holdings on a phone">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
