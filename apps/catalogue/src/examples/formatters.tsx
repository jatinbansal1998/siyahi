import { SiyahiProvider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useFormat } from "@siyahi/ui";

function Row({ label }: { label: string }) {
  const { money, moneyCompact, pct, time } = useFormat();
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="text-right">{money(153110)}</TableCell>
      <TableCell className="text-right">{moneyCompact(99999)}</TableCell>
      <TableCell className="text-right">{moneyCompact(240000)}</TableCell>
      <TableCell className="text-right">{moneyCompact(400000000)}</TableCell>
      <TableCell className="text-right">{pct(0.1234)}</TableCell>
      <TableCell className="text-right">{time("2026-10-20T09:00:00Z")}</TableCell>
    </TableRow>
  );
}

export default function FormattersExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Locale</TableHead>
          <TableHead className="text-right">money</TableHead>
          <TableHead className="text-right">moneyCompact</TableHead>
          <TableHead className="text-right">moneyCompact</TableHead>
          <TableHead className="text-right">moneyCompact</TableHead>
          <TableHead className="text-right">pct</TableHead>
          <TableHead className="text-right">time</TableHead>
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
