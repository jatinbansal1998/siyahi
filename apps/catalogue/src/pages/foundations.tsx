import { Card, CardContent } from "@siyahi/ui";
import { useSyncExternalStore } from "react";
import { Lead } from "../example";
import type { Page } from "../page";

// Classes are spelled out so Tailwind sees them.
const SURFACES = [
  { name: "background", swatch: "bg-background" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "card", swatch: "bg-card" },
  { name: "muted", swatch: "bg-muted" },
  { name: "muted-foreground", swatch: "bg-muted-foreground" },
  { name: "primary", swatch: "bg-primary" },
  { name: "secondary", swatch: "bg-secondary" },
  { name: "accent", swatch: "bg-accent" },
  { name: "border", swatch: "bg-border" },
  { name: "ring", swatch: "bg-ring" },
  { name: "destructive", swatch: "bg-destructive" },
];
const MEANING = [
  { name: "positive", swatch: "bg-positive", text: "text-positive", sample: "▲ 2.3% gain" },
  { name: "negative", swatch: "bg-negative", text: "text-negative", sample: "▼ 1.1% loss" },
  { name: "warning", swatch: "bg-warning", text: "text-warning", sample: "Two trades unmatched" },
  { name: "link", swatch: "bg-link", text: "text-link", sample: "Open the statement" },
];
const CHART = [
  { name: "chart-1", swatch: "bg-chart-1", hue: "blue" },
  { name: "chart-2", swatch: "bg-chart-2", hue: "emerald" },
  { name: "chart-3", swatch: "bg-chart-3", hue: "amber" },
  { name: "chart-4", swatch: "bg-chart-4", hue: "violet" },
  { name: "chart-5", swatch: "bg-chart-5", hue: "rose" },
];
const TYPE = [
  { name: "text-xs", className: "text-xs", note: "12px: ticks, captions" },
  { name: "text-sm", className: "text-sm", note: "14px: body, the base-vega default" },
  { name: "text-base", className: "text-base", note: "16px: card titles" },
  { name: "text-xl", className: "text-xl", note: "20px: section headings" },
  { name: "text-3xl", className: "text-3xl", note: "30px: page title, stat values" },
];
const SPACING = [
  { name: "1", bar: "w-1", px: 4 },
  { name: "2", bar: "w-2", px: 8 },
  { name: "4", bar: "w-4", px: 16 },
  { name: "6", bar: "w-6", px: 24 },
  { name: "8", bar: "w-8", px: 32 },
  { name: "12", bar: "w-12", px: 48 },
];
const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"];
const HEAT_STEPS = [12, 24, 36, 48, 60];

function onSchemeChange(callback: () => void): () => void {
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", callback);
  return () => scheme.removeEventListener("change", callback);
}

/**
 * The token's current value, read from the page so it follows the scheme.
 * Read while rendering, so the first paint already has it and no swatch grows a line.
 */
function useTokenValue(name: string): string {
  return useSyncExternalStore(onSchemeChange, () =>
    getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim(),
  );
}

function Swatch({ name, swatch, note }: { name: string; swatch: string; note?: string }) {
  const value = useTokenValue(name);
  return (
    <div className="flex items-center gap-3">
      <div className={`size-10 shrink-0 rounded-md border ${swatch}`} />
      <div className="min-w-0">
        <div className="font-mono text-xs">--{name}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">{value}</div>
        {note && <div className="text-xs text-muted-foreground">{note}</div>}
      </div>
    </div>
  );
}

const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

export const foundations: Page = {
  id: "foundations",
  title: "Foundations",
  lead: "Every value comes from one theme file, styles/siyahi.css. Pages name tokens; they never write a colour or a size.",
  sections: [
    {
      id: "colours",
      title: "Colours",
      body: (
        <>
          <Lead>shadcn's stock neutral theme in both schemes. The scheme follows the device.</Lead>
          <div className={grid}>
            {SURFACES.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "meaning",
      title: "Meaning colours",
      body: (
        <>
          <Lead>
            Four colours carry meaning; nothing else is coloured. Each passes 4.5:1 as text on the canvas and the card,
            and positive, negative and warning have a -foreground for text on a fill.
          </Lead>
          <div className={grid}>
            {MEANING.map((m) => (
              <div key={m.name} className="flex flex-col gap-2">
                <Swatch name={m.name} swatch={m.swatch} />
                <span className={m.text}>{m.sample}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "chart-palette",
      title: "Chart palette",
      body: (
        <>
          <Lead>
            Five hues in the same order in both schemes. Each slot reaches 3:1 against the card and against the slots
            next to it, which only lightness can give, so emerald and violet are the deep members. Slots two apart share
            a lightness and are told apart by hue, so series take slots in order. Every value is inside sRGB.
          </Lead>
          <div className={grid}>
            {CHART.map((c) => (
              <Swatch key={c.name} name={c.name} swatch={c.swatch} note={c.hue} />
            ))}
          </div>
          <Card>
            <CardContent className="flex h-24 flex-row items-end gap-2">
              {CHART.map((c, i) => (
                <div
                  key={c.name}
                  className={`flex-1 rounded-t-sm ${c.swatch} ${["h-1/2", "h-3/4", "h-full", "h-2/3", "h-5/6"][i]}`}
                />
              ))}
            </CardContent>
          </Card>
        </>
      ),
    },
    {
      id: "heat",
      title: "Heat steps",
      body: (
        <>
          <Lead>
            Signed scales mix --positive or --negative toward the card colour in five steps. Unsigned scales use steps
            of --chart-1.
          </Lead>
          <Card>
            <CardContent className="flex flex-col gap-2">
              {["--negative", "--positive", "--chart-1"].map((token) => (
                <div key={token} className="flex items-center gap-2">
                  <span className="w-24 font-mono text-xs">{token}</span>
                  {HEAT_STEPS.map((step) => (
                    <div
                      key={step}
                      className="flex h-8 flex-1 items-center justify-center rounded-sm text-xs"
                      style={{ backgroundColor: `color-mix(in oklab, var(${token}) ${step}%, var(--card))` }}
                    >
                      {step}%
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ),
    },
    {
      id: "type",
      title: "Type",
      body: (
        <>
          <Lead>
            Geist for text, Geist Mono for identifiers and chart ticks. Figures are tabular everywhere, so columns of
            numbers line up.
          </Lead>
          <div className="flex flex-col gap-3">
            {TYPE.map((t) => (
              <div key={t.name} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="w-24 font-mono text-xs text-muted-foreground">{t.name}</span>
                <span className={t.className}>₹1,53,110 portfolio</span>
                <span className="text-xs text-muted-foreground">{t.note}</span>
              </div>
            ))}
            <div className="flex flex-wrap items-baseline gap-x-4">
              <span className="w-24 font-mono text-xs text-muted-foreground">font-mono</span>
              <span className="font-mono">INE009A01021 · NSE:INFY</span>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "spacing",
      title: "Spacing and radius",
      body: (
        <>
          <Lead>
            Tailwind's 4px scale. Cards pad 24px (16px for size="sm"), page gutters are 16px on a phone. Radii derive
            from one --radius.
          </Lead>
          <div className="flex flex-col gap-2">
            {SPACING.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-24 font-mono text-xs text-muted-foreground">
                  {s.name} · {s.px}px
                </span>
                <div className={`h-3 rounded-sm bg-primary ${s.bar}`} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div className={`size-16 border bg-muted ${r}`} />
                <span className="font-mono text-xs text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ],
};
