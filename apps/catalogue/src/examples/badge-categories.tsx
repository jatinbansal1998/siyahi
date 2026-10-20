import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CategoryBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useFormat,
  type CategoryBadgeProps,
} from "@siyahi/ui";

type Hue = CategoryBadgeProps["hue"];
type Option = "A" | "B";

const units: [name: string, kind: string, hue: Hue][] = [
  ["portfolio.service", "service", 1],
  ["user.slice", "slice", 2],
  ["backup.timer", "timer", 3],
  ["docker.socket", "socket", 4],
  ["tailscaled.service", "service", 1],
];

const sectors: Record<string, Hue> = { IT: 1, Banks: 2, FMCG: 3, ETF: 4 };
const brokers: Record<string, Hue> = { Kite: 1, Dhan: 2 };
const ledger: [symbol: string, sector: string, broker: string, value: number][] = [
  ["INFY", "IT", "Kite", 224400],
  ["HDFCBANK", "Banks", "Kite", 262500],
  ["ITC", "FMCG", "Dhan", 276000],
  ["NIFTYBEES", "ETF", "Kite", 255600],
  ["SBIN", "Banks", "Dhan", 87000],
];

function Category({ option, hue, children }: { option: Option; hue: Hue; children: string }) {
  return option === "A" ? (
    <Badge variant="outline">{children}</Badge>
  ) : (
    <CategoryBadge hue={hue}>{children}</CategoryBadge>
  );
}

function Trial({ option }: { option: Option }) {
  const { money } = useFormat();
  return (
    <div className="grid gap-4 @4xl:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{option}: units</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Kind</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map(([name, kind, hue]) => (
                <TableRow key={name}>
                  <TableCell className="font-mono">{name}</TableCell>
                  <TableCell>
                    <Category option={option} hue={hue}>
                      {kind}
                    </Category>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>{option}: ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map(([symbol, sector, broker, value]) => (
                <TableRow key={symbol}>
                  <TableCell className="font-mono">{symbol}</TableCell>
                  <TableCell>
                    <Category option={option} hue={sectors[sector] ?? 5}>
                      {sector}
                    </Category>
                  </TableCell>
                  <TableCell>
                    <Category option={option} hue={brokers[broker] ?? 5}>
                      {broker}
                    </Category>
                  </TableCell>
                  <TableCell className="text-right">{money(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// 0.1.6 trial: A is the outline Badge for every category, B a CategoryBadge per chart hue.
export default function BadgeCategoriesExample() {
  return (
    <div className="@container flex flex-col gap-4" data-slot="badge-trial">
      <Trial option="A" />
      <Trial option="B" />
    </div>
  );
}
