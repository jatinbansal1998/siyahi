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

// Each finished marketing campaign's net return, ₹: sales it brought in less what it cost; made-up figures.
const campaigns = [
  { name: "Festive sale", value: 61000 },
  { name: "Referrals", value: 38000 },
  { name: "Email win-back", value: 17000 },
  { name: "Billboards", value: -26000 },
  { name: "Podcast ads", value: -14000 },
  { name: "Trade fair", value: -6000 },
];
const won = campaigns.filter((c) => c.value > 0).reduce((sum, c) => sum + c.value, 0);
const lost = campaigns.filter((c) => c.value < 0).reduce((sum, c) => sum + c.value, 0);
// One scale both ways, so whichever side reaches farther is the net.
const reach = Math.max(won, -lost);

export default function DistributionBarTugExample() {
  const [focus, setFocus] = useState<DistributionSegment | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaigns earned ₹70,000 more than they lost</CardTitle>
        <CardDescription>Each finished campaign, losses left of break-even and gains right</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <DistributionBar
            min={-reach}
            max={reach}
            showLegend={false}
            markers={[{ at: 0 }]}
            highlighted={focus?.name ?? null}
            onHover={setFocus}
            segments={campaigns.map(({ name, value }) => ({
              name,
              value,
              color: value > 0 ? "var(--positive)" : "var(--negative)",
            }))}
          />
          <div className="grid grid-cols-3 text-xs text-muted-foreground tabular-nums">
            <span>
              lost <Delta value={lost} format="money" />
            </span>
            <span className="text-center">break-even</span>
            <span className="text-right">
              earned <Delta value={won} format="money" />
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="min-h-12" aria-live="polite">
        {focus ? (
          <p className="flex items-center gap-2">
            <span className="font-medium">{focus.name}</span>
            <Delta value={focus.value} format="money" />
          </p>
        ) : (
          <p className="text-muted-foreground">Hover a band to see its campaign.</p>
        )}
      </CardFooter>
    </Card>
  );
}
