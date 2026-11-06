import { BarList, Card, CardContent, CardDescription, CardHeader, CardTitle, useFormat } from "@siyahi/ui";

// This quarter's revenue against last quarter's, by city: the biggest rises and falls; made-up figures.
const gains = [
  { name: "Mumbai", value: 84000 },
  { name: "Bengaluru", value: 52000 },
  { name: "Pune", value: 31000 },
];
const losses = [
  { name: "Kolkata", value: 18400 },
  { name: "Jaipur", value: 7600 },
];

export default function BarListSidesExample() {
  const { money } = useFormat();
  // One scale for both lists, so a small loss draws a short bar beside a large gain.
  const max = Math.max(...[...gains, ...losses].map((row) => row.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle>What moved revenue</CardTitle>
        <CardDescription>The biggest ₹ rises and falls by city, on one scale</CardDescription>
      </CardHeader>
      {/* Each list is a column of its own, headed and ruled off, with its figures at its own right edge, so a
          gain's figure never reads as the label of the loss beside it. */}
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 md:gap-0 md:divide-x">
          <div className="md:pr-6">
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">Gains</h3>
            <BarList data={gains} max={max} color="var(--positive)" valueFormatter={(v) => money(v)} />
          </div>
          <div className="md:pl-6">
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">Losses</h3>
            <BarList data={losses} max={max} color="var(--negative)" valueFormatter={(v) => money(v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
