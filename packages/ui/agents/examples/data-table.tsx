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
  { product: "Kids chair", category: "Seating", units: 200, revenue: 258000, change: 0.022 },
  { product: "Desk lamp", category: "Lighting", units: 900, revenue: 255600, change: 0.009 },
];

// The page's own rule for a product that needs a look; a falling figure alone would not be one.
const tone = (product: Product): "warning" | undefined => (product.units < 50 ? "warning" : undefined);

// One click sorts largest (or Z) first; the title comes from meta.label.
const header = () => <DataTableSortHeader />;

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const columns: DataTableColumnDef<Product>[] = [
  { accessorKey: "product", header, size: 140, meta: { label: "Product" } },
  { accessorKey: "category", header, size: 120, meta: { label: "Category" } },
  { accessorKey: "units", header, size: 100, meta: { label: "Units", variant: "number" } },
  {
    accessorKey: "revenue",
    header,
    size: 140,
    meta: { label: "Revenue", variant: "number" },
    cell: ({ row }) => <Money amount={row.original.revenue} />,
  },
  {
    accessorKey: "change",
    header,
    size: 110,
    meta: { label: "Change", variant: "number" },
    cell: ({ row }) => <Delta value={row.original.change} />,
  },
];

export default function DataTableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>This week's units and revenue for each product, with the change on last week</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot
          data={products}
          columns={columns}
          initialState={{ columnPinning: { start: ["product"], end: [] } }}
        >
          <DataTableToolbarSection>
            <DataTableSearchFilter
              placeholder="Search products…"
              label="Filter products"
              className="flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="category" title="Category" />
            <DataTableRowCount unit="products" />
          </DataTableToolbarSection>
          <DataTable aria-label="Products">
            <DataTableHeader />
            <DataTableBody getRowTone={tone} />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
