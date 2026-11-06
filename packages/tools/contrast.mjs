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
 * a treemap tile.
 * @typedef {string} Paint
 */
/** @typedef {{ fg: Paint, bg: Paint, min: number, scheme?: Scheme }} Pair */

const TEXT = 4.5;
const MARK = 3;
const SURFACES = ["background", "card"];
const CHARTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/**
 * The label on each treemap heat step, both sides: the foreground, or with `own` the side's own foreground.
 * @param {Scheme} scheme @param {number[]} shares @param {boolean} [own]
 * @returns {Pair[]}
 */
const heatLabels = (scheme, shares, own = false) =>
  ["positive", "negative"].flatMap((side) =>
    shares.map((share) => ({
      fg: own ? `${side}-foreground` : "foreground",
      bg: `${side}@${share}`,
      min: TEXT,
      scheme,
    })),
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
  // A tone's icon or StatusBadge dot against the tone's own wash (lib/tone.ts).
  ...[
    ["link", "chart-1/8"],
    ["warning", "warning/10"],
    ["positive", "positive/8"],
    ["negative", "negative/8"],
  ].map(([fg = "", bg = ""]) => ({ fg, bg, min: MARK })),
  // The selected tab's fill against its list.
  { fg: "foreground", bg: "muted", min: MARK },
  // Chart marks on the canvas and the card. A dimmed bar keeps its full colour
  // as its outline, so these are the outlines too.
  ...[...CHARTS, "positive", "negative"].map((fg) => ({ fg, bg: "", min: MARK })),
  ...CHARTS.slice(0, -1).map((fg, i) => ({ fg, bg: CHARTS[i + 1] ?? "", min: MARK })),
  // Treemap labels on every heat step (lib/treemap.ts heatFill and heatText):
  // 14% to 70% of the meaning colour in the card in light under the
  // foreground; in dark 22% to 46% under the foreground, then 78% under the
  // colour's own foreground (the full colour is its own pair above).
  ...heatLabels("light", [14, 28, 42, 56, 70]),
  ...heatLabels("dark", [22, 34, 46]),
  ...heatLabels("dark", [78], true),
];

/**
 * @param {Theme} theme
 * @returns {Check[]}
 */
export function checkContrast(theme) {
  /** @type {Map<string, Check>} */
  const checks = new Map();
  for (const scheme of /** @type {const} */ (["light", "dark"])) {
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
      const [, name = "", sep, amount] = /^([\w-]+)(?:([/@])([\d.]+))?$/.exec(paint) ?? [];
      const base = token(name);
      if (sep === "@") {
        const rgb = oklchToSrgb(mixOklab(base, token("card"), Number(amount) / 100));
        return { rgb, name: `--${name} ${amount}% in --card` };
      }
      const alpha = base.alpha * (sep === "/" ? Number(amount) / 100 : 1);
      if (alpha === 1) return { rgb: oklchToSrgb(base), name: `--${paint}` };
      return { rgb: over({ ...base, alpha }, under.rgb), name: `--${paint} over ${under.name}` };
    };
    for (const pair of PAIRS) {
      if (pair.scheme && pair.scheme !== scheme) continue;
      for (const surface of SURFACES) {
        const page = { rgb: oklchToSrgb(token(surface)), name: `--${surface}` };
        const bg = pair.bg ? paintOver(pair.bg, page) : page;
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
