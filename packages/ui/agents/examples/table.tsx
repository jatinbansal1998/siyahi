import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  useFormat,
} from "@siyahi/ui";

const rows = [
  { month: "July", in: 85000, out: 12000 },
  { month: "August", in: 85000, out: 64000 },
  { month: "September", in: 92000, out: 8000 },
];

export default function TableExample() {
  const { money } = useFormat();
  const total = (key: "in" | "out") => rows.reduce((sum, row) => sum + row[key], 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash flow</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead data-numeric>In</TableHead>
              <TableHead data-numeric>Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              // August's spending needs a look: the page marks the row, and the theme washes it amber.
              <TableRow key={row.month} data-tone={row.out > 50000 ? "warning" : undefined}>
                <TableCell>{row.month}</TableCell>
                <TableCell data-numeric>{money(row.in)}</TableCell>
                <TableCell data-numeric>{money(row.out)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell data-numeric>{money(total("in"))}</TableCell>
              <TableCell data-numeric>{money(total("out"))}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
