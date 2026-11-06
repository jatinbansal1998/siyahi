import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TargetRows,
  useFormat,
  type TargetRow,
  type TargetStatus,
} from "@siyahi/ui";

interface Sleeve {
  name: string;
  holdings: string;
  /** Today's share of the portfolio and the plan's share, as fractions; made-up figures. */
  weight: number;
  target: number;
}

const sleeves: Sleeve[] = [
  { name: "Large-cap equity", holdings: "HDFCBANK, ICICIBANK, INFY, TCS", weight: 0.426, target: 0.4 },
  { name: "Mid and small cap", holdings: "Two mid-cap funds", weight: 0.189, target: 0.2 },
  { name: "Debt", holdings: "Corporate bond fund, PPF", weight: 0.194, target: 0.25 },
  { name: "Gold", holdings: "GOLDBEES, Sovereign Gold Bonds", weight: 0.093, target: 0.1 },
  { name: "International", holdings: "Nasdaq 100 fund of funds", weight: 0.098, target: 0.05 },
];

// Within two points of the plan is on target; past five is far enough to rebalance.
const NEAR = 0.02;
const FAR = 0.05;

const pts = (value: number) => `${(value * 100).toFixed(1)} pts`;

function statusOf({ weight, target }: Sleeve): TargetStatus {
  const gap = weight - target;
  const size = `${pts(Math.abs(gap))} ${gap > 0 ? "over" : "under"}`;
  if (Math.abs(gap) <= NEAR) return { kind: "met", label: "On target" };
  if (Math.abs(gap) <= FAR) return { kind: "missed", label: size };
  return { kind: "warning", label: `${size}, rebalance` };
}

export default function TargetRowsExample() {
  const f = useFormat();
  const rows: TargetRow[] = sleeves.map((sleeve) => ({
    label: sleeve.name,
    detail: sleeve.holdings,
    value: sleeve.weight,
    target: sleeve.target,
    bands: [
      [sleeve.target - FAR, sleeve.target + FAR],
      [sleeve.target - NEAR, sleeve.target + NEAR],
    ],
    status: statusOf(sleeve),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt is 5.6 points under its target</CardTitle>
        <CardDescription>Each sleeve's share of the portfolio against the plan, on one 0–50% scale</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Bar: today's weight. Tall tick: the target. Shading: within 5 points of it, darker within 2.
        </p>
        <TargetRows rows={rows} domain={[0, 0.5]} valueFormatter={(value) => f.pct(value)} />
      </CardContent>
    </Card>
  );
}
