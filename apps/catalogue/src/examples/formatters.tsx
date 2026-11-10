import { SiyahiProvider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useFormat } from "@siyahi/ui";

function Row({ label }: { label: string }) {
  const { count, money, moneyCompact, pct, time } = useFormat();
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell data-numeric>{count(153110)}</TableCell>
      <TableCell data-numeric>{money(153110)}</TableCell>
      <TableCell data-numeric>{moneyCompact(99999)}</TableCell>
      <TableCell data-numeric>{moneyCompact(240000)}</TableCell>
      <TableCell data-numeric>{moneyCompact(400000000)}</TableCell>
      <TableCell data-numeric>{pct(0.1234)}</TableCell>
      <TableCell data-numeric>{time("2026-10-20T09:00:00Z")}</TableCell>
    </TableRow>
  );
}

export default function FormattersExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Locale</TableHead>
          <TableHead data-numeric>count</TableHead>
          <TableHead data-numeric>money</TableHead>
          <TableHead data-numeric>moneyCompact</TableHead>
          <TableHead data-numeric>moneyCompact</TableHead>
          <TableHead data-numeric>moneyCompact</TableHead>
          <TableHead data-numeric>pct</TableHead>
          <TableHead data-numeric>time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Row label="Default (en-IN, INR, Kolkata)" />
        <SiyahiProvider locale={{ numberLocale: "en-US", currency: "USD", timeZone: "America/New_York" }}>
          <Row label="en-US, USD, New York" />
        </SiyahiProvider>
      </TableBody>
    </Table>
  );
}
