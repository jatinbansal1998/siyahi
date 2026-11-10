import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Delta,
  Input,
  PageHero,
  PanelGrid,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  useFormat,
} from "@siyahi/ui";
import { DownloadIcon, LightbulbIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import ChartArea from "./chart-area";
import SectionCardsTrend from "./section-cards-trend";

interface Holding {
  name: string;
  kind: string;
  status: string;
  tone: "positive" | "warning" | "negative";
  value: number;
  change: number;
}

const holdings: Holding[] = [
  { name: "Nifty 50 index fund", kind: "Equity", status: "On track", tone: "positive", value: 1840000, change: 0.124 },
  { name: "Flexi cap fund", kind: "Equity", status: "On track", tone: "positive", value: 962000, change: 0.087 },
  { name: "Gold bonds, 2031", kind: "Gold", status: "Review", tone: "warning", value: 410500, change: 0.211 },
  { name: "Short-term debt fund", kind: "Debt", status: "On track", tone: "positive", value: 655000, change: 0.031 },
  { name: "Small cap fund", kind: "Equity", status: "Below plan", tone: "negative", value: 318200, change: -0.064 },
];

// The catalogue's own ink drop, painted with currentColor so the masthead tints it.
function InkDrop() {
  return (
    <svg viewBox="0 0 16 16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 .5C8 .5 2.5 6.3 2.5 10a5.5 5.5 0 0 0 11 0C13.5 6.3 8 .5 8 .5ZM4.75 10A3.25 3.25 0 0 0 8 13.25v-1.5A1.75 1.75 0 0 1 6.25 10Z"
      />
    </svg>
  );
}

function Holdings({ rows }: { rows: Holding[] }) {
  const { money, pct } = useFormat();
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  // The change of the whole: today's total against what the same holdings were worth a year ago.
  const yearAgo = rows.reduce((sum, row) => sum + row.value / (1 + row.change), 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Value today and change over twelve months</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Holding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead data-numeric>Value</TableHead>
              <TableHead data-numeric>12 months</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <span className="text-muted-foreground">No holding matches the search.</span>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              // Only the holdings that need a look are marked; a row on track stays plain.
              <TableRow key={row.name} data-tone={row.tone === "positive" ? undefined : row.tone}>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-2">
                    {row.name}
                    <Badge variant="outline">{row.kind}</Badge>
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                </TableCell>
                <TableCell data-numeric>{money(row.value)}</TableCell>
                <TableCell data-numeric>
                  <Delta value={row.change} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell data-numeric>{money(total)}</TableCell>
              <TableCell data-numeric>{yearAgo > 0 && pct(total / yearAgo - 1)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

// An app page on the default, ruled surface: masthead, controls, stat tiles, a chart and a table in a PanelGrid, and
// the takeaway. It sets no surface: ruled on white is what a page gets.
export default function OverviewDashboard() {
  const [query, setQuery] = useState("");
  const shown = holdings.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        mark={<InkDrop />}
        eyebrow="The Book"
        title="Holdings"
        lead="What you own, what it is worth today, and how each part has moved."
        detail="Prices as of the last market close."
        actions={
          <>
            <Button>
              <PlusIcon />
              Add a holding
            </Button>
            <Button variant="outline">
              <DownloadIcon />
              Export
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup defaultValue={["1y"]} variant="outline" aria-label="Period">
          <ToggleGroupItem value="1m">1 month</ToggleGroupItem>
          <ToggleGroupItem value="1y">1 year</ToggleGroupItem>
          <ToggleGroupItem value="all">All</ToggleGroupItem>
        </ToggleGroup>
        <Input
          className="w-56"
          type="search"
          placeholder="Search holdings"
          aria-label="Search holdings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Five holdings in three kinds.{" "}
          <a className="text-link underline underline-offset-4" href="#/data">
            How value is worked out
          </a>
        </p>
      </div>
      <SectionCardsTrend />
      <PanelGrid>
        <ChartArea />
        <Holdings rows={shown} />
      </PanelGrid>
      <Callout tone="accent" icon={<LightbulbIcon />} title="The takeaway">
        Equity is <strong>74%</strong> of the book against a plan of 65%. The small cap fund is the only holding below
        plan.
      </Callout>
    </div>
  );
}
