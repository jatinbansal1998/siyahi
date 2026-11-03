import { Card, CardContent, CardDescription, CardHeader, CardTitle, DistributionBar } from "@siyahi/ui";

// Where a memory budget sits, on a fixed 0 to 12 GiB scale; made-up figures.
const gib = (value: number) => `${value.toFixed(1)} GiB`;

export default function DistributionBarBudgetExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The agents group's budget</CardTitle>
        <CardDescription>0 to 12 GiB; the lines mark its limits</CardDescription>
      </CardHeader>
      <CardContent>
        <DistributionBar
          max={12}
          valueFormatter={gib}
          markers={[
            { at: 6, label: "High" },
            { at: 8.7, label: "Max" },
          ]}
          segments={[
            { name: "In RAM, under High", value: 6, color: "var(--chart-1)" },
            { name: "In RAM, over High", value: 1.4, color: "var(--chart-2)" },
            { name: "Pushed to zram", value: 2.6, color: "var(--chart-3)" },
          ]}
        />
      </CardContent>
    </Card>
  );
}
