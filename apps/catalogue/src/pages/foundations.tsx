import { PaletteIcon } from "lucide-react";
import { Card, CardContent } from "@siyahi/ui";
import { useSyncExternalStore } from "react";
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
  { name: "warning", swatch: "bg-warning", text: "text-warning", sample: "Two payments unmatched" },
  { name: "link", swatch: "bg-link", text: "text-link", sample: "Open the report" },
];
const CHART = [
  { name: "chart-1", swatch: "bg-chart-1", hue: "indigo" },
  { name: "chart-2", swatch: "bg-chart-2", hue: "amber" },
  { name: "chart-3", swatch: "bg-chart-3", hue: "plum" },
  { name: "chart-4", swatch: "bg-chart-4", hue: "sky" },
  { name: "chart-5", swatch: "bg-chart-5", hue: "teal" },
];
const TYPE = [
  { name: "text-xs", className: "text-xs", note: "12px: ticks, captions" },
  { name: "text-sm", className: "text-sm", note: "14px: body, the base-nova default" },
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
  icon: <PaletteIcon />,
  lead: "Every value comes from one theme file, styles/siyahi.css. Pages name tokens; they never write a colour or a size.",
  // Short rules beside their swatches: one page reads faster than seven routes.
  layout: "stack",
  families: [
    {
      id: "colours",
      title: "Colours",
      lead: "shadcn's neutral greys in both schemes; the scheme follows the device.",
      rules: [
        "Ink indigo is placed, not spread: links, focus rings, the selected sidebar item and the first chart series.",
      ],
      body: (
        <div className={grid}>
          {SURFACES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      ),
    },
    {
      id: "meaning",
      title: "Meaning colours",
      lead: "Four colours carry meaning; nothing else is coloured.",
      rules: [
        "Each passes 4.5:1 as text on the canvas and the card.",
        "positive, negative and warning have a -foreground for text on a fill.",
      ],
      body: (
        <div className={grid}>
          {MEANING.map((m) => (
            <div key={m.name} className="flex flex-col gap-2">
              <Swatch name={m.name} swatch={m.swatch} />
              <span className={m.text}>{m.sample}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "chart-palette",
      title: "Chart palette",
      lead: "Five hues in the same order in both schemes, with no green or red, so no series reads as a gain or a loss.",
      rules: [
        "Each slot reaches 3:1 against the card and against the slots next to it, which only lightness can give, so indigo, plum and teal are the deep members and amber and sky the pale ones, in both schemes.",
        "Slots two apart share a lightness and are told apart by hue, so series take slots in order.",
        "In charts, amber (chart-2) carries no warning meaning; warning amber is for alerts and badges only.",
        "Ordered buckets (largest 5 / #6–10 / rest) use chart-1 heat steps (100% / 60% / 30%), not separate hues.",
        "Every value is inside sRGB.",
      ],
      body: (
        <div className={grid}>
          {CHART.map((c) => (
            <Swatch key={c.name} name={c.name} swatch={c.swatch} note={c.hue} />
          ))}
        </div>
      ),
      examples: [{ name: "chart-bar", caption: "Three series taking --chart-1 to --chart-3 in order." }],
    },
    {
      id: "heat",
      title: "Heat steps",
      lead: "Signed scales mix --positive or --negative toward the card colour in five steps; unsigned scales use steps of --chart-1.",
      body: (
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
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
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "type",
      title: "Type",
      lead: "Geist for text, Geist Mono for identifiers and chart ticks.",
      rules: ["Figures are tabular everywhere, so columns of numbers line up."],
      body: (
        <div className="flex flex-col gap-3">
          {TYPE.map((t) => (
            <div key={t.name} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="w-24 font-mono text-xs text-muted-foreground">{t.name}</span>
              <span className={t.className}>₹1,53,110 revenue</span>
              <span className="text-xs text-muted-foreground">{t.note}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="w-24 font-mono text-xs text-muted-foreground">font-mono</span>
            <span className="font-mono">ORD-1042 · commit a3f9c2e</span>
          </div>
        </div>
      ),
    },
    {
      id: "spacing",
      title: "Spacing and radius",
      lead: "Tailwind's 4px scale, and radii derived from one --radius.",
      rules: ['Cards pad 16px (12px for size="sm"); page gutters are 16px on a phone.'],
      body: (
        <>
          <div className="flex flex-col gap-2">
            {SPACING.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-24 font-mono text-xs text-muted-foreground">
                  {s.name} · {s.px}px
                </span>
                {/* Square ends: a rounded 4px bar read as a dot, not a length. */}
                <div className={`h-4 bg-primary ${s.bar}`} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div className={`size-16 border border-foreground/25 bg-muted ${r}`} />
                <span className="font-mono text-xs text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "surfaces",
      title: "Surfaces",
      lead: "How a data block sits on the page, set by SiyahiProvider's surface.",
      imports: ["SiyahiProvider", "PanelGrid", "type Surface"],
      props: [
        {
          name: "surface",
          type: '"card" | "ruled" | "open"',
          default: '"card"',
          purpose: "Set on a nested provider for one part of a page; left out, a provider keeps the surface around it.",
        },
      ],
      rules: [
        "card, the default, is shadcn's own card: a white box with a 1px ring on the faintly tinted canvas, so data reads as raised off the page.",
        "ruled takes the box off every card and draws a hairline between the blocks of a PanelGrid: one surface, parted by lines, as on an operations screen.",
        "open drops the lines too, and the card's padding, so a block's content sits level with the page's text, for pages read top to bottom.",
        "A picked SectionCards tile keeps its ring on every surface.",
      ],
      examples: [
        {
          name: "surfaces",
          caption: "A toggle switching one set of figures, a chart and a table between card, ruled and open.",
        },
      ],
    },
  ],
};
