import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableActiveFilters,
  DataTableBody,
  DataTableFacetedFilter,
  DataTableHeader,
  DataTableRoot,
  DataTableRowCount,
  DataTableSearchFilter,
  DataTableSortHeader,
  DataTableToolbarSection,
  type DataTableColumnDef,
  type ExtendedColumnFilter,
} from "@siyahi/ui";

interface Shipment {
  order: string;
  status: string;
  warehouse: string;
  courier: string;
}
const data: Shipment[] = [
  { order: "ORD-1042", status: "Out for delivery", warehouse: "Bhiwandi", courier: "Delhivery" },
  { order: "ORD-1043", status: "Packed", warehouse: "Hosur", courier: "Blue Dart" },
  { order: "ORD-1044", status: "Out for delivery", warehouse: "Hosur", courier: "Delhivery" },
  { order: "ORD-1045", status: "Delivered", warehouse: "Gurugram", courier: "Ekart" },
  { order: "ORD-1046", status: "Packed", warehouse: "Bhiwandi", courier: "Ekart" },
  { order: "ORD-1047", status: "Returned", warehouse: "Hosur", courier: "Blue Dart" },
  { order: "ORD-1048", status: "Out for delivery", warehouse: "Gurugram", courier: "Delhivery" },
  { order: "ORD-1049", status: "Delivered", warehouse: "Hosur", courier: "Ekart" },
];
const header = () => <DataTableSortHeader />;
const columns: DataTableColumnDef<Shipment>[] = [
  { accessorKey: "order", header, size: 120, meta: { label: "Order" } },
  { accessorKey: "status", header, meta: { label: "Status" } },
  { accessorKey: "warehouse", header, meta: { label: "Warehouse" } },
  { accessorKey: "courier", header, meta: { label: "Courier" } },
];

// The page opens on the orders still on the road, as a link from a "Not yet delivered" figure would.
const inTransit: ExtendedColumnFilter<Shipment> = {
  id: "status",
  value: ["Packed", "Out for delivery"],
  variant: "multiSelect",
  operator: "in",
  filterId: "faceted-status",
  joinOperator: "and",
};

export default function DataTableFilterBarExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipments this week</CardTitle>
        <CardDescription>Every order sent out since Monday, with where it stands</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={data}
          columns={columns}
          initialState={{ columnFilters: [{ id: "status", value: inTransit }] }}
        >
          <DataTableToolbarSection>
            <DataTableSearchFilter
              label="Search shipments"
              placeholder="Search shipments…"
              className="w-full flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="status" title="Status" multiple />
            <DataTableFacetedFilter accessorKey="warehouse" title="Warehouse" multiple />
            <DataTableRowCount unit="shipments" />
            <DataTableActiveFilters />
          </DataTableToolbarSection>
          <DataTable aria-label="Shipments this week">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
