import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTablePagination,
  DataTableRoot,
  DataTableRowCount,
  DataTableSearchFilter,
  DataTableSortHeader,
  DataTableToolbarSection,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Invoice {
  invoice: string;
  customer: string;
  amount: number;
}

const customers = ["Sharma Textiles", "Bluepine Logistics", "Lakeview Clinics", "Coastal Foods (India)", "Orbit Labs"];
// 240 made-up invoices, numbered from INV-2001.
const invoices: Invoice[] = Array.from({ length: 240 }, (_, i) => ({
  invoice: `INV-${2001 + i}`,
  customer: customers[i % customers.length]!,
  amount: 4000 + ((i * 7919) % 96000),
}));

const header = () => <DataTableSortHeader />;

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const columns: DataTableColumnDef<Invoice>[] = [
  { accessorKey: "invoice", header, size: 120, meta: { label: "Invoice" } },
  { accessorKey: "customer", header, size: 200, meta: { label: "Customer" } },
  {
    accessorKey: "amount",
    header,
    size: 140,
    meta: { label: "Amount", variant: "number" },
    cell: ({ row }) => <Money amount={row.original.amount} />,
  },
];

export default function DataTablePaginationExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices this year</CardTitle>
        <CardDescription>Every invoice raised since April, newest last</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={invoices} columns={columns}>
          <DataTableToolbarSection>
            <DataTableSearchFilter
              label="Search invoices"
              placeholder="Search invoices…"
              className="w-full flex-none sm:w-64"
            />
            <DataTableRowCount unit="invoices" />
          </DataTableToolbarSection>
          <DataTable aria-label="Invoices this year">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
          <DataTablePagination pageSizeOptions={[10, 25, 50]} />
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
