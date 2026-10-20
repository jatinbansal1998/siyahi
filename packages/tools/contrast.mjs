#!/usr/bin/env node
// @ts-check
// Fails when a theme colour is too faint to read: 4.5:1 for text on the
// canvas and the card and for a foreground on its own fill, 3:1 for chart
// colours against the card and against the slot next to them, and each
// category badge's text on its tint. Slots two apart
// share a lightness and are told apart by hue, so they are not compared. Chart
// colours must also sit inside sRGB, so the browser paints what was scored.
//
//   siyahi-contrast styles/siyahi.css
import { readFileSync, realpathSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { contrast, inSrgb, mixOklab, parseOklch, toHex } from "./color.mjs";
import { readTheme } from "./theme.mjs";

/** @typedef {import("./theme.mjs").Theme} Theme */
/** @typedef {{ scheme: "light" | "dark", fg: string, bg: string, ratio: number, min: number }} Check */

const TEXT = ["foreground", "muted-foreground", "positive", "negative", "warning", "link", "destructive"];
const SURFACES = ["background", "card"];
const FILLS = [
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["positive-foreground", "positive"],
  ["negative-foreground", "negative"],
  ["warning-foreground", "warning"],
  ["sidebar-foreground", "sidebar"],
];
const CHARTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
const BADGES = [1, 2, 3, 4, 5].map((n) => [`badge-${n}-foreground`, `badge-${n}`]);
const MIX = /^color-mix\(\s*in oklab\s*,\s*var\(--([\w-]+)\)\s+([\d.]+)%\s*,\s*var\(--([\w-]+)\)\s*\)$/i;

/**
 * A token's colour in one scheme. A `color-mix()` of two tokens is written
 * once, in the light block: the browser resolves its var()s against the dark
 * values in dark, so the check mixes the dark values too.
 * @param {Theme} theme @param {"light" | "dark"} scheme @param {string} name
 * @returns {import("./color.mjs").Oklch}
 */
function resolve(theme, scheme, name) {
  const value = theme[scheme][name] ?? (MIX.test(theme.light[name] ?? "") ? theme.light[name] : undefined);
  if (value === undefined) throw new Error(`${scheme}: --${name} is not set in the ${scheme} block`);
  const mix = MIX.exec(value);
  if (mix)
    return mixOklab(resolve(theme, scheme, mix[1] ?? ""), resolve(theme, scheme, mix[3] ?? ""), Number(mix[2]) / 100);
  const parsed = parseOklch(value);
  if (!parsed) throw new Error(`${scheme}: --${name} is "${value}", not an oklch() colour`);
  if (parsed.alpha < 1) throw new Error(`${scheme}: --${name} is translucent; contrast needs an opaque colour`);
  return parsed;
}

/**
 * @param {Theme} theme
 * @returns {Check[]}
 */
export function checkContrast(theme) {
  /** @type {Check[]} */
  const checks = [];
  for (const scheme of /** @type {const} */ (["light", "dark"])) {
    const color = (/** @type {string} */ name) => resolve(theme, scheme, name);
    const pair = (/** @type {string} */ fg, /** @type {string} */ bg, /** @type {number} */ min) =>
      checks.push({ scheme, fg, bg, ratio: contrast(color(fg), color(bg)), min });
    for (const fg of TEXT) for (const bg of SURFACES) pair(fg, bg, 4.5);
    for (const [fg, bg] of [...FILLS, ...BADGES]) pair(/** @type {string} */ (fg), /** @type {string} */ (bg), 4.5);
    CHARTS.forEach((chart, i) => {
      pair(chart, "card", 3);
      const next = CHARTS[i + 1];
      if (next) pair(chart, next, 3);
    });
  }
  return checks;
}

/**
 * Chart colours outside sRGB, named for the error message.
 * @param {Theme} theme
 * @returns {string[]}
 */
export function checkGamut(theme) {
  return /** @type {const} */ (["light", "dark"]).flatMap((scheme) =>
    CHARTS.filter((name) => {
      const parsed = parseOklch(theme[scheme][name] ?? "");
      return parsed !== null && !inSrgb(parsed);
    }).map((name) => `${scheme} --${name} ${theme[scheme][name]} is outside sRGB; lower its chroma`),
  );
}

/**
 * @param {Theme} theme
 * @param {Check} check
 */
function describe(theme, check) {
  const hex = (/** @type {string} */ name) => toHex(resolve(theme, check.scheme, name));
  return `${check.scheme.padEnd(5)} --${check.fg} ${hex(check.fg)} on --${check.bg} ${hex(check.bg)}: ${check.ratio.toFixed(2)}:1 (needs ${check.min}:1)`;
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
  for (const check of failures) console.error(`FAIL ${describe(theme, check)}`);
  for (const problem of outOfGamut) console.error(`FAIL ${problem}`);
  const weakest = checks.toSorted((a, b) => a.ratio / a.min - b.ratio / b.min)[0];
  console.log(
    `contrast: ${checks.length - failures.length}/${checks.length} pairs pass` +
      (weakest ? `; closest: ${describe(theme, weakest)}` : ""),
  );
  process.exit(failures.length || outOfGamut.length ? 1 : 0);
}
