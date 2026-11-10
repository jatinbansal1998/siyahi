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

interface Product {
  product: string;
  category: string;
  /** Units sold and revenue this month; change is the revenue against last week. Made-up figures. */
  units: number;
  revenue: number;
  change: number;
}

const products: Product[] = [
  { product: "Standing desk", category: "Furniture", units: 120, revenue: 224400, change: 0.018 },
  { product: "Office chair", category: "Seating", units: 150, revenue: 262500, change: -0.006 },
  { product: "Bookshelf", category: "Furniture", units: 40, revenue: 166000, change: 0.004 },
  { product: "Dinner set", category: "Kitchen, Dining & Tableware", units: 600, revenue: 276000, change: -0.012 },
];

const header = () => <DataTableSortHeader />;

// While the change column is hidden to fit, the week's change rides under the revenue it belongs to.
function RevenueCell({ product }: { product: Product }) {
  const format = useFormat();
  const { compactColumns } = useDataTable<Product>();
  if (!compactColumns?.hidden.has("change")) return format.money(product.revenue);
  return (
    <div className="flex flex-col items-end">
      {format.money(product.revenue)}
      <Delta value={product.change} />
    </div>
  );
}

const columns: DataTableColumnDef<Product>[] = [
  { accessorKey: "product", header, size: 140, meta: { label: "Product", compact: true } },
  { accessorKey: "category", header, size: 120, meta: { label: "Category" } },
  { accessorKey: "units", header, size: 100, meta: { label: "Units", variant: "number" } },
  {
    accessorKey: "revenue",
    header,
    size: 140,
    meta: { label: "Revenue", variant: "number", compact: true },
    cell: ({ row }) => <RevenueCell product={row.original} />,
  },
  {
    accessorKey: "change",
    header,
    size: 110,
    meta: { label: "Change this week", variant: "number" },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
];

export default function DataTableCompactExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by product</CardTitle>
        <CardDescription>This week's revenue for each product, with the change on last week</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={products} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
            <DataTableRowCount unit="products" />
          </DataTableToolbarSection>
          <DataTable aria-label="Revenue by product">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
