import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataBar,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  Sparkline,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Store {
  store: string;
  /** This month's sales, and their change on last month, in rupees; made-up figures. */
  sales: number;
  change: number;
  /** Orders on each of the last ten days, oldest first. */
  daily: number[];
}

const stores: Store[] = [
  { store: "Delhi", sales: 276000, change: -18400, daily: [478, 474, 470, 471, 466, 463, 465, 461, 459, 460] },
  { store: "Bengaluru", sales: 262500, change: 21300, daily: [312, 318, 326, 320, 331, 344, 339, 348, 352, 350] },
  { store: "Chennai", sales: 258000, change: 44100, daily: [250, 262, 258, 271, 266, 280, 284, 279, 288, 290] },
  { store: "Kolkata", sales: 255600, change: 12800, daily: [281, 282, 280, 283, 284, 283, 285, 284, 286, 284] },
  { store: "Mumbai", sales: 224400, change: 30900, daily: [220, 234, 229, 241, 252, 248, 260, 255, 266, 270] },
  { store: "Pune", sales: 166000, change: -2600, daily: [180, 172, 165, 170, 158, 150, 161, 155, 148, 150] },
];

// Each bar is a share of its column's largest figure, so the rows draw to one scale.
const largestSales = Math.max(...stores.map((s) => s.sales));
const largestChange = Math.max(...stores.map((s) => Math.abs(s.change)));

function Money({ amount }: { amount: number }) {
  return useFormat().money(amount);
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Store>[] = [
  { accessorKey: "store", header, size: 120, meta: { label: "Store" } },
  {
    accessorKey: "sales",
    header,
    size: 170,
    meta: { label: "Sales", variant: "number" },
    cell: ({ row }) => (
      <DataBar value={row.original.sales} max={largestSales}>
        <Money amount={row.original.sales} />
      </DataBar>
    ),
  },
  {
    accessorKey: "change",
    header,
    size: 170,
    meta: { label: "Change on last month", variant: "number" },
    cell: ({ row }) => (
      <DataBar value={row.original.change} max={largestChange} tone="sign">
        <Money amount={row.original.change} />
      </DataBar>
    ),
  },
  {
    id: "daily",
    header: "Last 10 days",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => {
      const { daily } = row.original;
      const rising = (daily.at(-1) ?? 0) >= (daily[0] ?? 0);
      return (
        <Sparkline
          data={daily}
          variant="line"
          color={rising ? "var(--positive)" : "var(--negative)"}
          animate={false}
          className="h-5 w-20"
        />
      );
    },
  },
];

export default function DataBarExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stores</CardTitle>
        <CardDescription>Bars give each figure's size against the column's largest</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={stores} columns={columns} initialState={{ columnPinning: { start: ["store"], end: [] } }}>
          <DataTable>
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
