import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Delta,
  DistributionBar,
  type DistributionSegment,
} from "@siyahi/ui";

// Each closed position's net realized, ₹; made-up figures.
const positions = [
  { name: "INFY", value: 61000 },
  { name: "TCS", value: 38000 },
  { name: "HDFCBANK", value: 17000 },
  { name: "ITC", value: -26000 },
  { name: "WIPRO", value: -14000 },
  { name: "SBIN", value: -6000 },
];
const won = positions.filter((p) => p.value > 0).reduce((sum, p) => sum + p.value, 0);
const lost = positions.filter((p) => p.value < 0).reduce((sum, p) => sum + p.value, 0);
// One scale both ways, so whichever side reaches farther is the net.
const reach = Math.max(won, -lost);

export default function DistributionBarTugExample() {
  const [focus, setFocus] = useState<DistributionSegment | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>The tug-of-war</CardTitle>
        <CardDescription>Each closed position, losses left of break-even and gains right</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <DistributionBar
          min={-reach}
          max={reach}
          showLegend={false}
          markers={[{ at: 0 }]}
          highlighted={focus?.name ?? null}
          onHover={setFocus}
          segments={positions.map((p) => ({
            ...p,
            color: p.value > 0 ? "var(--positive)" : "var(--negative)",
          }))}
        />
        <div className="grid grid-cols-3 text-xs text-muted-foreground tabular-nums">
          <span>
            losers <Delta value={lost} format="money" />
          </span>
          <span className="text-center">break-even</span>
          <span className="text-right">
            winners <Delta value={won} format="money" />
          </span>
        </div>
      </CardContent>
      <CardFooter className="min-h-12" aria-live="polite">
        {focus ? (
          <p className="flex items-center gap-2">
            <span className="font-medium">{focus.name}</span>
            <Delta value={focus.value} format="money" />
          </p>
        ) : (
          <p className="text-muted-foreground">Hover a band to see its position.</p>
        )}
      </CardFooter>
    </Card>
  );
}
