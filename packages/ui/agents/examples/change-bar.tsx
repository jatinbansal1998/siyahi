import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChangeBar,
  DataTable,
  DataTableBody,
  DataTableCompactColumnsToggle,
  DataTableFootnote,
  DataTableHeader,
  DataTableRoot,
  DataTableSortHeader,
  DataTableToolbarSection,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Region {
  region: string;
  /** Revenue in January and in February, in rupees; made-up figures. */
  january: number;
  february: number;
  change: number;
}

const region = (name: string, january: number, february: number): Region => ({
  region: name,
  january,
  february,
  change: february / january - 1,
});

const regions: Region[] = [
  region("West", 231900, 258000),
  region("South", 248300, 262500),
  region("Central", 161300, 166000),
  region("East", 250400, 255600),
  region("Northeast", 283100, 276000),
  region("North", 241800, 224400),
];

// Every bar is a share of the column's largest move, and the column holds gains and losses, so the bars diverge.
const largestChange = Math.max(...regions.map((r) => Math.abs(r.change)));
const diverging = regions.some((r) => r.change < 0) && regions.some((r) => r.change > 0);

function Money({ amount, muted = false }: { amount: number; muted?: boolean }) {
  const text = useFormat().money(amount);
  return muted ? <span className="text-muted-foreground">{text}</span> : text;
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Region>[] = [
  { accessorKey: "region", header, size: 130, meta: { label: "Region", compact: true } },
  {
    accessorKey: "january",
    header,
    size: 130,
    meta: { label: "January", variant: "number" },
    cell: ({ row }) => <Money amount={row.original.january} muted />,
  },
  {
    accessorKey: "february",
    header,
    size: 130,
    meta: { label: "February", variant: "number", compact: true },
    cell: ({ row }) => <Money amount={row.original.february} />,
  },
  {
    accessorKey: "change",
    header,
    size: 150,
    meta: { label: "Change", variant: "number", compact: true },
    cell: ({ row }) => <ChangeBar value={row.original.change} max={largestChange} diverging={diverging} />,
  },
];

export default function ChangeBarExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The West grew 11.3% in February, the North fell 7.2%</CardTitle>
        <CardDescription>Each region's revenue in February against January</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={regions} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
          </DataTableToolbarSection>
          <DataTable aria-label="February against January">
            <DataTableHeader />
            <DataTableBody />
            <DataTableFootnote>
              Each percent is the change on January's value, and the bar is its size against the largest move. Gains run
              right of the centre line, losses left.
            </DataTableFootnote>
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
