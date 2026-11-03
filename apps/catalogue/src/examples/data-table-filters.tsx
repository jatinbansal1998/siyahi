import {
  Button,
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useDataTable,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Holding {
  symbol: string;
  sector: string;
  broker: string;
}
const data: Holding[] = [
  { symbol: "INFY", sector: "Information technology", broker: "Kite" },
  { symbol: "HDFCBANK", sector: "Banks", broker: "Dhan" },
  { symbol: "TCS", sector: "Information technology", broker: "Dhan" },
];
const header = () => <DataTableSortHeader />;
const columns: DataTableColumnDef<Holding>[] = [
  { accessorKey: "symbol", header, size: 140, meta: { label: "Instrument" } },
  { accessorKey: "sector", header, meta: { label: "Sector" } },
  { accessorKey: "broker", header, meta: { label: "Broker" } },
];

function Filters() {
  const { table, isCompact } = useDataTable<Holding>();
  const active = table.state.columnFilters.length;
  const controls = (
    <div className="flex flex-wrap gap-2">
      <DataTableFacetedFilter accessorKey="sector" title="Sector" />
      <DataTableFacetedFilter accessorKey="broker" title="Broker" />
    </div>
  );
  if (!isCompact) return controls;
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>Filters{active ? ` (${active})` : ""}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Holding filters</SheetTitle>
          <SheetDescription>Selections stay applied when this panel closes.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4">{controls}</div>
        <SheetFooter>
          <Button variant="outline" disabled={!active} onClick={() => table.resetColumnFilters()}>
            Clear filters
          </Button>
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function DataTableFiltersExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings with compact filters</CardTitle>
        <CardDescription>Search stays visible; secondary filters move into a panel in narrow space.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* The closed filter panel is absent at first render, so configure its features explicitly. */}
        <DataTableRoot data={data} columns={columns} config={{ enableFilters: true, enableSorting: true }}>
          <DataTableToolbarSection>
            <DataTableSearchFilter
              label="Search compact example"
              placeholder="Search holdings…"
              className="w-full sm:w-64"
            />
            <Filters />
            <DataTableRowCount unit="holdings" />
          </DataTableToolbarSection>
          <DataTable aria-label="Holdings with compact filters">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
