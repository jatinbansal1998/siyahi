import { Card, CardContent, CardDescription, CardHeader, CardTitle, ChangeGrid, type ChangeGridRow } from "@siyahi/ui";

// Profit or loss per store per quarter; made-up figures.
const quarters = ["Q1", "Q2", "Q3", "Q4"];
const stores: [string, number[]][] = [
  ["Koramangala", [412_000, 386_000, 455_000, 520_000]],
  ["Indiranagar", [218_000, -42_000, 131_000, 264_000]],
  ["Whitefield", [-86_000, -124_000, 38_000, 61_000]],
  ["Online", [305_000, 344_000, 398_000, 471_000]],
  ["Jayanagar", [96_000, -158_000, -212_000, -64_000]],
];
const rows: ChangeGridRow[] = stores.map(([label, values]) => ({
  label,
  values,
  total: values.reduce((sum, value) => sum + value, 0),
}));

export default function ChangeGridMoneyExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by store and quarter</CardTitle>
        <CardDescription>After rent and wages. The year adds its quarters.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid
          label="Profit by store and quarter"
          columns={quarters}
          rows={rows}
          format="money"
          totalLabel="Year"
        />
      </CardContent>
    </Card>
  );
}
