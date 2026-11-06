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
  TreemapLegend,
  useFormat,
  type TreemapItem,
} from "@siyahi/ui";
import { useState } from "react";

interface City extends TreemapItem {
  channel: string;
}

// weight is the month's sales in ₹ and change their growth on the same month last year; Guwahati opened this year,
// so it has no last year to grow from. Mumbai sells online and in stores, so it draws two tiles under one name.
const cities: City[] = [
  { name: "Mumbai", key: "mumbai-online", channel: "Online", group: "West", weight: 224400, change: 0.38 },
  { name: "Mumbai", key: "mumbai-stores", channel: "Stores", group: "West", weight: 152000, change: 0.12 },
  { name: "Pune", channel: "Stores", group: "West", weight: 166000, change: 0.09 },
  { name: "Surat", channel: "Online", group: "West", weight: 98000, change: -0.21 },
  { name: "Bengaluru", channel: "Stores", group: "South", weight: 262500, change: -0.06 },
  { name: "Chennai", channel: "Stores", group: "South", weight: 258000, change: 0.44 },
  { name: "Kochi", channel: "Online", group: "South", weight: 87000, change: 0.58 },
  { name: "Delhi", channel: "Stores", group: "North", weight: 276000, change: 0.27 },
  { name: "Jaipur", channel: "Online", group: "North", weight: 64000, change: -0.33 },
  { name: "Kolkata", channel: "Stores", group: "East", weight: 255600, change: 0.16 },
  { name: "Guwahati", channel: "Online", group: "Northeast", weight: 52000, change: null },
];

export default function TreemapExample() {
  const [hovered, setHovered] = useState<City | null>(null);
  const [selected, setSelected] = useState<City | null>(null);
  const { money, pct } = useFormat();
  const figures = (c: City) =>
    `${money(c.weight)} · ${c.change === null ? "new this year" : `${c.change < 0 ? "\u2212" : "+"}${pct(Math.abs(c.change))}`}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by region</CardTitle>
        <CardDescription>
          Area is the city's sales this month; colour is its growth on last year, deepest at ±60%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tooltip open={hovered !== null} trackCursorAxis="both">
          <TooltipTrigger render={<div />}>
            <Treemap
              items={cities}
              height={320}
              range={0.6}
              onHover={setHovered}
              selected={selected}
              onSelect={setSelected}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex flex-col items-start">
              {hovered && (
                <>
                  <span className="font-medium">
                    {hovered.name} · {hovered.channel}
                  </span>
                  <span>{hovered.group}</span>
                  <span>{figures(hovered)}</span>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        <TreemapLegend range={0.6} className="mt-3 ml-auto" />
        <p data-slot="treemap-selection" aria-live="polite" className="mt-3 text-sm tabular-nums">
          {selected ? (
            <>
              <span className="font-medium">
                {selected.name} · {selected.channel}
              </span>{" "}
              · {selected.group} · {figures(selected)}
            </>
          ) : (
            <span className="text-muted-foreground">Tap a tile for its figures</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
