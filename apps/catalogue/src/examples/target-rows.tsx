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

interface Team {
  name: string;
  costs: string;
  /** The team's share of this year's spend so far and the budget's share, as fractions; made-up figures. */
  weight: number;
  target: number;
}

const teams: Team[] = [
  { name: "Engineering", costs: "Cloud hosting, tools, contractors", weight: 0.426, target: 0.4 },
  { name: "Marketing", costs: "Ads, events, design agency", weight: 0.189, target: 0.2 },
  { name: "Sales", costs: "Travel, commissions, CRM seats", weight: 0.194, target: 0.25 },
  { name: "Support", costs: "Help desk seats, training", weight: 0.093, target: 0.1 },
  { name: "Operations", costs: "Office rent, facilities", weight: 0.098, target: 0.05 },
];

// Within two points of the budget is on target; past five is far enough to review it.
const NEAR = 0.02;
const FAR = 0.05;

const pts = (value: number) => `${(value * 100).toFixed(1)} pts`;

function statusOf({ weight, target }: Team): TargetStatus {
  const gap = weight - target;
  const size = `${pts(Math.abs(gap))} ${gap > 0 ? "over" : "under"}`;
  if (Math.abs(gap) <= NEAR) return { kind: "met", label: "On target" };
  if (Math.abs(gap) <= FAR) return { kind: "missed", label: size };
  return { kind: "warning", label: `${size}, review` };
}

export default function TargetRowsExample() {
  const f = useFormat();
  const rows: TargetRow[] = teams.map((team) => ({
    label: team.name,
    detail: team.costs,
    value: team.weight,
    target: team.target,
    bands: [
      [team.target - FAR, team.target + FAR],
      [team.target - NEAR, team.target + NEAR],
    ],
    status: statusOf(team),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales is 5.6 points under its budget</CardTitle>
        <CardDescription>
          Each team's share of spend against its share of the budget, on one 0–50% scale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            Bar: the share spent so far. Tall tick: the budgeted share. Shading: within 5 points of it, darker within 2.
          </p>
          <TargetRows rows={rows} domain={[0, 0.5]} valueFormatter={(value) => f.pct(value)} />
        </div>
      </CardContent>
    </Card>
  );
}
