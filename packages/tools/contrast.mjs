#!/usr/bin/env node
// @ts-check
// Fails when a theme colour is too faint where Siyahi's components paint it:
// 4.5:1 for text, 3:1 for a mark a reader needs (a control's edge, a focus
// ring, a selected tab, a chart mark). Each pair is checked on both surfaces a
// block can sit on, the canvas and the card, with translucent fills blended
// over that surface as the browser paints them. Chart slots two apart share a
// lightness and are told apart by hue, so they are not compared. Every colour
// must also sit inside sRGB, so the browser paints what was scored.
//
//   siyahi-contrast styles/siyahi.css
import { readFileSync, realpathSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { contrastSrgb, inSrgb, mixOklab, oklchToSrgb, over, parseOklch, srgbHex } from "./color.mjs";
import { readTheme } from "./theme.mjs";

/** @typedef {import("./theme.mjs").Theme} Theme */
/** @typedef {import("./color.mjs").Oklch} Oklch */
/** @typedef {"light" | "dark"} Scheme */
/** @typedef {{ scheme: Scheme, fg: string, bg: string, fgHex: string, bgHex: string, ratio: number, min: number }} Check */
/**
 * What a component paints, written as Tailwind writes it:
 * `muted` is the token, `muted/50` the token at 50% over what lies under it,
 * and `positive@60` is `color-mix(in oklab, var(--positive) 60%, var(--card))`,
 * a treemap tile; `positive@heat-5` and `negative/wash` take the share from the
 * theme's --heat-5 or --wash.
 * @typedef {string} Paint
 */
/**
 * `surface` limits a pair to the canvas or the card, for a paint only one of them ever holds, such as a chart card's
 * hover band. A list of paints for `bg` lays each over the one before, such as a footer band over an exception's wash.
 * @typedef {{ fg: Paint, bg: Paint | Paint[], min: number, scheme?: Scheme, surface?: "background" | "card" }} Pair
 */

const TEXT = 4.5;
const MARK = 3;
// A fill told apart from the fill or card beside it, inside a 1px edge that already carries the mark's 3:1. Only a
// nearly solid tint reaches 3:1 against its neighbour's: the solid slots next to each other sit just over 3:1, and
// mixing both into the card narrows that. At 25% a stack's pale segments sat at 1.2:1 against each other and read as
// one. 1.5:1 is a guard against sliding back there, not a published threshold.
const FILL = 1.5;
const SURFACES = ["background", "card"];
const CHARTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/**
 * The label on each heat step, both sides, at the shares the theme's --heat-1 to --heat-5 set.
 * @type {Pair[]}
 */
const HEAT_LABELS = ["positive", "negative"].flatMap((side) =>
  [1, 2, 3, 4, 5].map((step) => ({ fg: "foreground", bg: `${side}@heat-${step}`, min: TEXT })),
);

/** @type {Pair[]} */
const PAIRS = [
  // Text on the page and on each token's own fill.
  ...["foreground", "muted-foreground", "positive", "negative", "warning", "link", "destructive"].map((fg) => ({
    fg,
    bg: "",
    min: TEXT,
  })),
  ...[
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["accent-foreground", "accent"],
    ["positive-foreground", "positive"],
    ["negative-foreground", "negative"],
    ["warning-foreground", "warning"],
    ["sidebar-foreground", "sidebar"],
    ["sidebar-primary-foreground", "sidebar-primary"],
    ["sidebar-accent-foreground", "sidebar-accent"],
    // A selected toggle or tab: the foreground fill with the canvas colour as text.
    ["background", "foreground"],
  ].map(([fg = "", bg = ""]) => ({ fg, bg, min: TEXT })),
  // Muted text on the fills it sits on: avatar initials and highlighted code
  // lines (muted), a neutral Callout, CardFooter and the command field
  // (muted/50), a Quote's source (muted/60), the accent, warning, positive and
  // negative Callouts, StatusAlerts and StatusBadges, a removed code line
  // (destructive/10).
  ...["muted", "muted/50", "muted/60", "chart-1/8", "warning/10", "positive/8", "negative/8", "destructive/10"].map(
    (bg) => ({ fg: "muted-foreground", bg, min: TEXT }),
  ),
  // A destructive button or badge: its tint at rest and on hover, a light
  // menu item's focus, and a dark input's own fill under its text.
  { fg: "destructive", bg: "destructive/10", min: TEXT, scheme: "light" },
  { fg: "destructive", bg: "destructive/20", min: TEXT },
  { fg: "destructive", bg: "destructive/30", min: TEXT, scheme: "dark" },
  { fg: "foreground", bg: "input/30", min: TEXT, scheme: "dark" },
  { fg: "muted-foreground", bg: "input/30", min: TEXT, scheme: "dark" },
  // A field's edge against the page, against its own fill (a slider's muted
  // track, the command field, a dark field), so the box reads as a box. A
  // focus ring and an invalid field's edge recolour that edge and are read
  // against the page.
  ...["", "muted", "muted/50"].map((bg) => ({ fg: "input", bg, min: MARK })),
  { fg: "input", bg: "input/30", min: MARK, scheme: "dark" },
  ...["ring", "destructive"].map((fg) => ({ fg, bg: "", min: MARK })),
  // Focus is a 2px ring of --ring on the control's edge with a 2px ring of the
  // page colour inside it. The outer ring meets what lies around the control:
  // the page and the card (above), a tab list's muted fill and the sidebar.
  // The inner ring meets the control's own fill, which matters where that is
  // dark: a primary button's (a pressed toggle's foreground fill is checked
  // with the selected toggle's text, above).
  ...["muted", "sidebar"].map((bg) => ({ fg: "ring", bg, min: MARK })),
  { fg: "background", bg: "primary", min: MARK },
  // An invalid field's red wash (--field-wash): the value and placeholder on
  // it, and its red edge against it.
  ...["foreground", "muted-foreground"].map((fg) => ({ fg, bg: "destructive@field-wash", min: TEXT })),
  { fg: "destructive", bg: "destructive@field-wash", min: MARK },
  // A tone's icon or StatusBadge dot against the tone's own wash (lib/tone.ts).
  ...[
    ["link", "chart-1/8"],
    ["warning", "warning/10"],
    ["positive", "positive/8"],
    ["negative", "negative/8"],
  ].map(([fg = "", bg = ""]) => ({ fg, bg, min: MARK })),
  // A StatusHeatmap's degraded and critical days against a healthy one, its
  // default 30% grey, so a bad day stands out of a run of good ones.
  ...["warning", "destructive"].map((fg) => ({ fg, bg: "muted-foreground/30", min: MARK })),
  // An exception the page marks, washed in its tone at the theme's --wash. A
  // stat tile or a MetricStrip figure mixes the tone into the card, opaque
  // (`@wash`); a table row lays it over what is under it (`/wash`), and a data
  // table's pinned cell over its own card colour. On either: text, muted lines, a Delta
  // icon and --chart-1 (a tile's Sparkline, a row's DataBar; a run of gains or
  // losses takes --positive or --negative, as the SectionCards rule says). A
  // tile's footer band sits over its wash, and a StatusBadge's dot on its own
  // wash over a row's.
  ...["negative@wash", "negative/wash", "warning@wash", "warning/wash"].flatMap((wash) => [
    { fg: "foreground", bg: wash, min: TEXT },
    { fg: "muted-foreground", bg: wash, min: TEXT },
    { fg: "positive", bg: wash, min: MARK },
    { fg: "negative", bg: wash, min: MARK },
    { fg: "chart-1", bg: wash, min: MARK },
  ]),
  ...["negative", "warning"].map((tone) => ({
    fg: "muted-foreground",
    bg: [`${tone}@wash`, "muted/50"],
    min: TEXT,
  })),
  ...[
    ["negative", ["negative/wash", "negative/8"]],
    ["warning", ["warning/wash", "warning/10"]],
  ].map(([fg, bg]) => ({ fg: String(fg), bg: /** @type {Paint[]} */ (bg), min: MARK })),
  // A chart's forecast stretch is hatched with 1px stripes of the text colour
  // at 16% (lib/chart-marks). Its dashed lines and its FORECAST and TODAY
  // labels sit on card-coloured halos, so no stripe runs beside them; the
  // today rule in the link colour does meet the stripes.
  { fg: "link", bg: "foreground/16", min: MARK, surface: "card" },
  // The selected tab's fill against its list.
  { fg: "foreground", bg: "muted", min: MARK },
  // Chart marks on the canvas and the card. A bar is read by its full-colour
  // edge, so these are the edges too; a lone bar's tint inside is carried by the
  // edge and has no pair of its own, nor has a dimmed bar's fainter tint. A stale
  // block's marks (greyed, at 65%) are exempt: stale is meant to read faintly.
  ...[...CHARTS, "positive", "negative"].map((fg) => ({ fg, bg: "", min: MARK })),
  ...CHARTS.slice(0, -1).map((fg, i) => ({ fg, bg: CHARTS[i + 1] ?? "", min: MARK })),
  // A stack's segment a few pixels tall is mostly its edges, so its colour shows
  // through its tint (--stack-tint): against the card and the next slot's tint.
  ...CHARTS.map((slot) => ({ fg: `${slot}@stack-tint`, bg: "", min: FILL, surface: "card" })),
  ...CHARTS.slice(0, -1).map((slot, i) => ({
    fg: `${slot}@stack-tint`,
    bg: `${CHARTS[i + 1]}@stack-tint`,
    min: FILL,
    surface: "card",
  })),
  // Every bar colour against the 40% muted band a chart card lays behind a
  // hovered category (lib/chart-frame).
  ...[...CHARTS, "positive", "negative"].map((fg) => ({ fg, bg: "muted/40", min: MARK, surface: "card" })),
  // A chart card's footer text, on the footer's muted wash.
  { fg: "foreground", bg: "muted/50", min: TEXT },
  // Treemap, ChangeGrid and signed-calendar labels on every heat step
  // (lib/heat.ts heatFill), at the theme's own --heat-N shares. A ChangeGrid
  // cell with no change is muted, with its figure in the text colour.
  { fg: "foreground", bg: "muted", min: TEXT },
  ...HEAT_LABELS,
];

/**
 * @param {Theme} theme
 * @returns {Check[]}
 */
export function checkContrast(theme) {
  /** @type {Map<string, Check>} */
  const checks = new Map();
  for (const scheme of /** @type {const} */ (["light", "dark"])) {
    const percentage = (/** @type {string} */ name) => {
      const value = theme[scheme][name];
      const match = value === undefined ? null : /^([\d.]+)%$/.exec(value);
      if (!match) throw new Error(`${scheme}: --${name} is "${value}", not a percentage`);
      return Number(match[1]);
    };
    const token = (/** @type {string} */ name) => {
      const value = theme[scheme][name];
      if (value === undefined) throw new Error(`${scheme}: --${name} is not set in the ${scheme} block`);
      const parsed = parseOklch(value);
      if (!parsed) throw new Error(`${scheme}: --${name} is "${value}", not an oklch() colour`);
      return parsed;
    };
    /**
     * The sRGB a paint shows over what lies under it, and how a message names it.
     * @param {Paint} paint @param {{ rgb: [number, number, number], name: string }} under
     */
    const paintOver = (paint, under) => {
      const [, name = "", sep, amount = ""] = /^([\w-]+)(?:([/@])([\w.-]+))?$/.exec(paint) ?? [];
      const base = token(name);
      // A share is a number, or the name of a theme token holding a percentage, such as heat-5.
      const share = /^[\d.]+$/.test(amount) ? Number(amount) : sep ? percentage(amount) : 100;
      if (sep === "@") {
        const rgb = oklchToSrgb(mixOklab(base, token("card"), share / 100));
        return { rgb, name: `--${name} ${share}% in --card` };
      }
      const alpha = (base.alpha * share) / 100;
      if (alpha === 1) return { rgb: oklchToSrgb(base), name: `--${paint}` };
      return { rgb: over({ ...base, alpha }, under.rgb), name: `--${paint} over ${under.name}` };
    };
    for (const pair of PAIRS) {
      if (pair.scheme && pair.scheme !== scheme) continue;
      for (const surface of SURFACES) {
        if (pair.surface && pair.surface !== surface) continue;
        const page = { rgb: oklchToSrgb(token(surface)), name: `--${surface}` };
        const bg = [pair.bg].flat().reduce((under, paint) => (paint ? paintOver(paint, under) : under), page);
        const fg = paintOver(pair.fg, bg);
        const [fgHex, bgHex] = [srgbHex(fg.rgb), srgbHex(bg.rgb)];
        const ratio = contrastSrgb(fg.rgb, bg.rgb);
        checks.set(`${scheme} ${fg.name} ${bg.name}`, {
          scheme,
          fg: fg.name,
          bg: bg.name,
          fgHex,
          bgHex,
          ratio,
          min: pair.min,
        });
      }
    }
  }
  return [...checks.values()];
}

/**
 * Colours outside sRGB, named for the error message.
 * @param {Theme} theme
 * @returns {string[]}
 */
export function checkGamut(theme) {
  return /** @type {const} */ (["light", "dark"]).flatMap((scheme) =>
    Object.entries(theme[scheme])
      .filter(([, value]) => {
        const parsed = parseOklch(value);
        return parsed !== null && !inSrgb(parsed);
      })
      .map(([name, value]) => `${scheme} --${name} ${value} is outside sRGB; lower its chroma`),
  );
}

/** @param {Check} check */
function describe(check) {
  return `${check.scheme.padEnd(5)} ${check.fg} ${check.fgHex} on ${check.bg} ${check.bgHex}: ${check.ratio.toFixed(2)}:1 (needs ${check.min}:1)`;
}

// Run as a command, not when imported. A package manager starts this file
// through a bin link, so compare real paths.
const invoked = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: siyahi-contrast <theme.css>");
    process.exit(2);
  }
  const theme = readTheme(readFileSync(file, "utf8"));
  const checks = checkContrast(theme);
  const failures = checks.filter((c) => c.ratio < c.min);
  const outOfGamut = checkGamut(theme);
  for (const check of failures) console.error(`FAIL ${describe(check)}`);
  for (const problem of outOfGamut) console.error(`FAIL ${problem}`);
  const weakest = checks.toSorted((a, b) => a.ratio / a.min - b.ratio / b.min)[0];
  console.log(
    `contrast: ${checks.length - failures.length}/${checks.length} pairs pass` +
      (weakest ? `; closest: ${describe(weakest)}` : ""),
  );
  process.exit(failures.length || outOfGamut.length ? 1 : 0);
}
