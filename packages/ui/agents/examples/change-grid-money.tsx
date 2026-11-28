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
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const rows: ChangeGridRow[] = stores.map(([label, values]) => ({ label, values, total: sum(values) }));
// Amounts add, so each quarter's figure for the chain is its stores' sum.
const chain: ChangeGridRow = {
  label: "All stores",
  values: quarters.map((_, quarter) => sum(stores.map(([, values]) => values[quarter] ?? 0))),
  total: sum(rows.map((row) => row.total ?? 0)),
};

export default function ChangeGridMoneyExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by store and quarter</CardTitle>
        <CardDescription>
          After rent and wages. The year adds its quarters, and all stores add the stores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid
          label="Profit by store and quarter"
          columns={quarters}
          rows={rows}
          footer={chain}
          format="money"
          totalLabel="Year"
        />
      </CardContent>
    </Card>
  );
}
