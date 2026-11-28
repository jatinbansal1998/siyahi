import {
  type Formatters,
  SiyahiProvider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useFormat,
} from "@siyahi/ui";

const calls: [string, (f: Formatters) => string][] = [
  ["count(153110)", (f) => f.count(153110)],
  ["money(153110)", (f) => f.money(153110)],
  ["money(-18400)", (f) => f.money(-18400)],
  ["moneyCompact(99999)", (f) => f.moneyCompact(99999)],
  ["moneyCompact(240000)", (f) => f.moneyCompact(240000)],
  ["moneyCompact(12450000)", (f) => f.moneyCompact(12450000)],
  ["moneyCompact(12450000, undefined, 3)", (f) => f.moneyCompact(12450000, undefined, 3)],
  ["moneyCompact(34120000000)", (f) => f.moneyCompact(34120000000)],
  ["moneyCompact(1200000000000)", (f) => f.moneyCompact(1200000000000)],
  ["fixed(24312.45)", (f) => f.fixed(24312.45)],
  ["fixed(46.2, 1)", (f) => f.fixed(46.2, 1)],
  ["multiple(2.4)", (f) => f.multiple(2.4)],
  ["pct(0.1234)", (f) => f.pct(0.1234)],
  ["pct(-0.021)", (f) => f.pct(-0.021)],
  ['time("2026-10-20T09:00:00Z")', (f) => f.time("2026-10-20T09:00:00Z")],
  ['dateTime("2026-09-20T09:00:00Z")', (f) => f.dateTime("2026-09-20T09:00:00Z")],
];

function Figure({ write }: { write: (f: Formatters) => string }) {
  const f = useFormat();
  return <TableCell data-numeric>{write(f)}</TableCell>;
}

export default function FormattersExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead data-numeric>Default (en-IN)</TableHead>
          <TableHead data-numeric>en-US</TableHead>
          <TableHead>Call</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map(([call, write]) => (
          <TableRow key={call}>
            <Figure write={write} />
            <SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
              <Figure write={write} />
            </SiyahiProvider>
            <TableCell>
              <code>{call}</code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
