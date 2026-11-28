import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChangeBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useFormat,
} from "@siyahi/ui";

// What a delivery cost each region in January and in February, in rupees; made-up figures.
const region = (name: string, january: number, february: number) => ({
  region: name,
  february,
  change: february / january - 1,
});
const regions = [region("North", 64, 70), region("West", 58, 61), region("East", 71, 71), region("South", 66, 59)];

const largest = Math.max(...regions.map((row) => Math.abs(row.change)));
const [rose] = regions.toSorted((a, b) => b.change - a.change);
const [fell] = regions.toSorted((a, b) => a.change - b.change);

export default function ChangeBarCostsExample() {
  const { money, pct } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Delivery cost the {rose?.region} {pct(rose?.change ?? 0)} more in February, the {fell?.region}{" "}
          {pct(Math.abs(fell?.change ?? 0))} less
        </CardTitle>
        <CardDescription>
          What one delivery cost in each region in February against January. A rise in cost is bad news, so it shows in
          red.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Delivery cost by region, February against January">
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead data-numeric>Cost in February</TableHead>
              <TableHead data-numeric>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((row) => (
              <TableRow key={row.region}>
                <TableCell>{row.region}</TableCell>
                <TableCell data-numeric>{money(row.february)}</TableCell>
                <TableCell data-numeric className="w-36">
                  <ChangeBar value={row.change} max={largest} diverging rise="bad" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
