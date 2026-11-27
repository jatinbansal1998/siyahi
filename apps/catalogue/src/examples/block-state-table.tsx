import {
  BlockState,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyMessage,
  DataTableHeader,
  DataTableRoot,
  DataTableSearchFilter,
  DataTableSkeleton,
  DataTableToolbarSection,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Order {
  order: string;
  customer: string;
  warehouse: string;
}
const columns: DataTableColumnDef<Order>[] = [
  { accessorKey: "order", header: "Order", size: 120, meta: { label: "Order" } },
  { accessorKey: "customer", header: "Customer", meta: { label: "Customer" } },
  { accessorKey: "warehouse", header: "Warehouse", meta: { label: "Warehouse" } },
];

function OrdersTable({ title, loading }: { title: string; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Paid orders not yet handed to a courier</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={[]} columns={columns} isLoading={loading}>
          <DataTableToolbarSection>
            <DataTableSearchFilter label="Search orders" placeholder="Search orders…" className="flex-none sm:w-64" />
          </DataTableToolbarSection>
          <DataTable aria-label={title}>
            <DataTableHeader />
            <DataTableBody>
              <DataTableSkeleton rows={3} />
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <BlockState title="No order is waiting to ship" description="An order shows here once it is paid." />
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <BlockState title="No order matches the search" description="Clear the search to see every order." />
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}

export default function BlockStateTableExample() {
  return (
    <div className="flex flex-col gap-4">
      <OrdersTable title="Orders waiting to ship" loading={false} />
      <OrdersTable title="Orders waiting to ship, loading" loading />
    </div>
  );
}
