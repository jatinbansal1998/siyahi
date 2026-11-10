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
  DataTableSortHeader,
  DataTableToolbarSection,
  RangePosition,
  useFormat,
  type DataTableColumnDef,
} from "@siyahi/ui";

interface Service {
  service: string;
  /** Today's 95th-percentile response time and the fastest and slowest day of the last 30, in ms; made-up figures. */
  today: number;
  low: number;
  high: number;
  /** How far up its range today sits, 0 at the fastest day and 1 at the slowest, so the column sorts. */
  position: number;
}

const service = (name: string, today: number, low: number, high: number): Service => ({
  service: name,
  today,
  low,
  high,
  position: (today - low) / (high - low),
});

const services: Service[] = [
  service("search", 284, 241, 292),
  service("catalogue", 187, 131, 201),
  service("checkout", 329, 265, 342),
  service("images", 415, 359, 459),
  service("payments", 460, 399, 529),
  service("login", 175, 161, 203),
];

function Milliseconds({ value }: { value: number }) {
  return `${useFormat().count(value)} ms`;
}

const header = () => <DataTableSortHeader />;

const columns: DataTableColumnDef<Service>[] = [
  { accessorKey: "service", header, size: 130, meta: { label: "Service", compact: true } },
  {
    accessorKey: "today",
    header,
    size: 120,
    meta: { label: "95th percentile today", variant: "number" },
    cell: ({ row }) => <Milliseconds value={row.original.today} />,
  },
  {
    accessorKey: "position",
    header,
    size: 200,
    meta: { label: "30-day range", compact: true },
    cell: ({ row }) => (
      <RangePosition
        variant="compact"
        low={row.original.low}
        high={row.original.high}
        value={row.original.today}
        lowLabel="30-day fastest"
        highLabel="30-day slowest"
      />
    ),
  },
];

export default function RangePositionTableExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search is near its slowest of the month, login near its fastest</CardTitle>
        <CardDescription>
          Each service's response time today on a track from its fastest day to its slowest; sort to rank them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableRoot data={services} columns={columns}>
          <DataTableToolbarSection>
            <DataTableCompactColumnsToggle />
          </DataTableToolbarSection>
          <DataTable aria-label="Services in their 30-day range">
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>
      </CardContent>
    </Card>
  );
}
