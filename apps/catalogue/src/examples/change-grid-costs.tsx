import { Card, CardContent, CardDescription, CardHeader, CardTitle, ChangeGrid, type ChangeGridRow } from "@siyahi/ui";

// Each kitchen's cost per meal served, against the same quarter last year; made-up figures.
const quarters = ["Q1", "Q2", "Q3", "Q4"];
const rows: ChangeGridRow[] = [
  { label: "Koramangala", values: [0.042, 0.031, -0.012, 0.018] },
  { label: "Indiranagar", values: [-0.024, -0.035, -0.041, -0.016] },
  { label: "Whitefield", values: [0.067, 0.055, 0.021, 0.009] },
];

export default function ChangeGridCostsExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost per meal by kitchen and quarter</CardTitle>
        <CardDescription>
          Each quarter against the same quarter last year. A rise in cost is bad news, so it is tinted red and a fall
          green; the sign still follows the number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid label="Change in cost per meal by kitchen and quarter" columns={quarters} rows={rows} rise="bad" />
      </CardContent>
    </Card>
  );
}
