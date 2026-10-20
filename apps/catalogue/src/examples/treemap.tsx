import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Treemap,
  useFormat,
  type TreemapItem,
} from "@siyahi/ui";
import { useState } from "react";

interface Holding extends TreemapItem {
  broker: string;
}

// change is the return since bought; LT came in as a transfer, with no cost basis.
const holdings: Holding[] = [
  { name: "INFY", key: "INFY-kite", broker: "Kite", group: "IT", weight: 224400, change: 0.38 },
  { name: "INFY", key: "INFY-dhan", broker: "Dhan", group: "IT", weight: 152000, change: 0.12 },
  { name: "TCS", broker: "Kite", group: "IT", weight: 166000, change: 0.09 },
  { name: "WIPRO", broker: "Dhan", group: "IT", weight: 98000, change: -0.21 },
  { name: "HDFCBANK", broker: "Kite", group: "Banks", weight: 262500, change: -0.06 },
  { name: "ICICIBANK", broker: "Kite", group: "Banks", weight: 258000, change: 0.44 },
  { name: "SBIN", broker: "Dhan", group: "Banks", weight: 87000, change: 0.58 },
  { name: "ITC", broker: "Kite", group: "FMCG", weight: 276000, change: 0.27 },
  { name: "ASIANPAINT", broker: "Dhan", group: "FMCG", weight: 64000, change: -0.33 },
  { name: "NIFTYBEES", broker: "Kite", group: "ETF", weight: 255600, change: 0.16 },
  { name: "LT", broker: "Dhan", group: "Construction", weight: 52000, change: null },
];

export default function TreemapExample() {
  const [hovered, setHovered] = useState<Holding | null>(null);
  const [selected, setSelected] = useState<Holding | null>(null);
  const { money, pct } = useFormat();
  const figures = (h: Holding) =>
    `${money(h.weight)} · ${h.change === null ? "no cost basis" : `${h.change < 0 ? "▼" : "▲"} ${pct(Math.abs(h.change))}`}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings by sector</CardTitle>
        <CardDescription>Area is the holding's value; colour is its return, deepest at ±60%</CardDescription>
      </CardHeader>
      <CardContent>
        <Tooltip open={hovered !== null} trackCursorAxis="both">
          <TooltipTrigger render={<div />}>
            <Treemap items={holdings} height={320} range={0.6} onHover={setHovered} onSelect={setSelected} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex-col items-start gap-0 tabular-nums">
            {hovered && (
              <>
                <span className="font-medium">
                  {hovered.name} · {hovered.broker}
                </span>
                <span>{figures(hovered)}</span>
              </>
            )}
          </TooltipContent>
        </Tooltip>
        <p data-slot="treemap-selection" className="mt-3 text-sm tabular-nums">
          {selected ? (
            <>
              <span className="font-medium">
                {selected.name} · {selected.broker}
              </span>{" "}
              · {figures(selected)}
            </>
          ) : (
            <span className="text-muted-foreground">Tap a tile for its figures</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
