import { Card, CardContent, CardDescription, CardHeader, CardTitle, ChangeGrid, type ChangeGridRow } from "@siyahi/ui";

// A café chain's sales growth on the month before, per financial year (April to March); made-up figures.
const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const rows: ChangeGridRow[] = [
  {
    label: "FY24",
    values: [0.031, 0.012, -0.024, 0.008, 0.017, -0.006, 0.041, 0.052, 0.063, -0.038, 0.004, 0.022],
    total: 0.196,
  },
  {
    label: "FY25",
    values: [0.018, -0.011, -0.032, 0.014, 0.009, 0, 0.036, 0.047, 0.071, -0.044, -0.008, 0.019],
    total: 0.124,
  },
  // The year is under way: months still to come have no figure.
  {
    label: "FY26",
    values: [0.026, 0.015, -0.018, 0.021, 0.012, 0.007, 0.044, null, null, null, null, null],
    total: 0.112,
  },
];

export default function ChangeGridExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales growth by month</CardTitle>
        <CardDescription>
          Each month against the one before. Deeper tints are larger changes; the year compounds its months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeGrid label="Sales growth by month and financial year" columns={months} rows={rows} totalLabel="Year" />
      </CardContent>
    </Card>
  );
}
