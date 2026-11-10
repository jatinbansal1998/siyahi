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

interface Order {
  order: string;
  status: string;
  warehouse: string;
}
const data: Order[] = [
  { order: "ORD-1042", status: "Out for delivery", warehouse: "Bhiwandi" },
  { order: "ORD-1043", status: "Packed", warehouse: "Hosur" },
  { order: "ORD-1044", status: "Out for delivery", warehouse: "Hosur" },
];
const header = () => <DataTableSortHeader />;
const columns: DataTableColumnDef<Order>[] = [
  { accessorKey: "order", header, size: 140, meta: { label: "Order" } },
  { accessorKey: "status", header, meta: { label: "Status" } },
  { accessorKey: "warehouse", header, meta: { label: "Warehouse" } },
];

function Filters() {
  const { table, isCompact } = useDataTable<Order>();
  const active = table.state.columnFilters.length;
  const controls = (
    <div className="flex flex-wrap gap-2">
      <DataTableFacetedFilter accessorKey="status" title="Status" />
      <DataTableFacetedFilter accessorKey="warehouse" title="Warehouse" />
    </div>
  );
  if (!isCompact) return controls;
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>Filters{active ? ` (${active})` : ""}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order filters</SheetTitle>
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
        <CardTitle>Open orders</CardTitle>
        <CardDescription>Orders packed or out for delivery, by warehouse</CardDescription>
      </CardHeader>
      <CardContent>
        {/* The closed filter panel is absent at first render, so configure its features explicitly. */}
        <DataTableRoot data={data} columns={columns} config={{ enableFilters: true, enableSorting: true }}>
          <DataTableToolbarSection>
            <DataTableSearchFilter
              label="Search orders"
              placeholder="Search orders…"
              className="w-full flex-none sm:w-64"
            />
            <Filters />
            <DataTableRowCount unit="orders" />
          </DataTableToolbarSection>
          <DataTable aria-label="Open orders">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
