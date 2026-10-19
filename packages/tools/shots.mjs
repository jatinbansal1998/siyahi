#!/usr/bin/env node
// @ts-check
// Renders pages in Playwright's Chromium at 1920 and 390 wide, light and dark,
// checks the layout rules every Siyahi page keeps, and writes one full-page
// PNG per page and mode.
//
//   siyahi-shots <url>... [--out shots] [--gutter 16]
//
// Checks: a gutter of at least --gutter px on both sides of visible text and
// cards (content inside a sideways-scrolling box, and navigation chrome such
// as a sidebar, is exempt), no sideways
// document scroll (also with a classic scrollbar taking its width), and Geist
// as the loaded body font.
//
// The capture first grows the viewport to the page's height and waits, so
// charts that redraw on resize settle before the picture is taken; a
// stitched full-page capture catches them mid-animation.
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

/** @typedef {{ name: string, width: number, height: number, dark: boolean }} Mode */
/** @typedef {{ gutterLeft: number | null, gutterRight: number | null, overflow: number, overflowWithScrollbar: number, font: string, fontLoaded: boolean, docHeight: number, h1: string | null }} Probe */

/** @type {Mode[]} */
const MODES = [
  { name: "1920-light", width: 1920, height: 1080, dark: false },
  { name: "1920-dark", width: 1920, height: 1080, dark: true },
  { name: "390-light", width: 390, height: 844, dark: false },
  { name: "390-dark", width: 390, height: 844, dark: true },
];
const MAX_HEIGHT = 16000;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string", default: "shots" }, gutter: { type: "string", default: "16" } },
});
if (positionals.length === 0) {
  console.error("usage: siyahi-shots <url>... [--out shots] [--gutter 16]");
  process.exit(2);
}
const outDir = path.resolve(values.out);
const minGutter = Number(values.gutter);
mkdirSync(outDir, { recursive: true });

/** @param {string} url */
function slugOf(url) {
  const u = new URL(url);
  const slug = `${u.pathname}${u.hash}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return slug || "index";
}

// Runs in the page. Kept as a string so the bundled code is exactly what runs.
const PROBE = `(() => {
  const de = document.documentElement;
  const scrollsSideways = (el) => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const o = getComputedStyle(e).overflowX;
      if ((o === "auto" || o === "scroll") && e.scrollWidth > e.clientWidth) return true;
    }
    return false;
  };
  const visible = [...document.querySelectorAll('h1,h2,h3,h4,p,li,td,th,[data-slot="card"]')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.right <= 0 || r.left >= de.clientWidth) return false;
    if (el.closest('nav, aside, [data-slot="sidebar"]')) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && !scrollsSideways(el);
  });
  const lefts = visible.map((el) => el.getBoundingClientRect().left);
  const rights = visible.map((el) => de.clientWidth - el.getBoundingClientRect().right);
  const overflow = de.scrollWidth - de.clientWidth;
  const prev = de.style.overflowY;
  de.style.overflowY = "scroll";
  void document.body.offsetHeight;
  const overflowWithScrollbar = de.scrollWidth - de.clientWidth;
  de.style.overflowY = prev;
  const font = getComputedStyle(document.body).fontFamily;
  const first = font.split(",")[0].trim().replace(/^["']|["']$/g, "");
  const h1 = document.querySelector("h1");
  return {
    gutterLeft: lefts.length ? Math.round(Math.min(...lefts)) : null,
    gutterRight: rights.length ? Math.round(Math.min(...rights)) : null,
    overflow,
    overflowWithScrollbar,
    font: first,
    fontLoaded: document.fonts.check('16px "' + first + '"') && [...document.fonts].some((f) => f.family.replace(/["']/g, "") === first && f.status === "loaded"),
    docHeight: de.scrollHeight,
    h1: h1 ? h1.textContent.trim().slice(0, 60) : null,
  };
})()`;

const SETTLE = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;

/**
 * @param {import("playwright").Browser} browser
 * @param {string} url
 * @param {Mode} mode
 * @returns {Promise<{ probe: Probe, file: string }>}
 */
async function shoot(browser, url, mode) {
  const context = await browser.newContext({
    viewport: { width: mode.width, height: mode.height },
    colorScheme: mode.dark ? "dark" : "light",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(SETTLE);
  /** @type {Probe} */
  const probe = await page.evaluate(PROBE);
  await page.setViewportSize({
    width: mode.width,
    height: Math.min(Math.max(probe.docHeight, mode.height), MAX_HEIGHT),
  });
  await page.waitForTimeout(1500);
  await page.evaluate(SETTLE);
  const file = path.join(outDir, `${slugOf(url)}-${mode.name}.png`);
  await page.screenshot({ path: file });
  await context.close();
  return { probe, file };
}

/**
 * @param {Probe} p
 * @returns {string[]}
 */
function problemsOf(p) {
  const problems = [];
  if (p.gutterLeft !== null && p.gutterLeft < minGutter)
    problems.push(`left gutter is ${p.gutterLeft}px, under ${minGutter}px`);
  if (p.gutterRight !== null && p.gutterRight < minGutter)
    problems.push(`right gutter is ${p.gutterRight}px, under ${minGutter}px`);
  if (p.overflow > 0) problems.push(`document scrolls sideways by ${p.overflow}px`);
  if (p.overflowWithScrollbar > 0)
    problems.push(`scrolls sideways by ${p.overflowWithScrollbar}px once a scrollbar takes its width`);
  if (!p.font.startsWith("Geist")) problems.push(`body font is ${p.font}, not Geist`);
  else if (!p.fontLoaded) problems.push(`${p.font} is named but never loaded`);
  if (p.docHeight > MAX_HEIGHT) problems.push(`page is ${p.docHeight}px tall; the shot stops at ${MAX_HEIGHT}px`);
  return problems;
}

const browser = await chromium.launch();
let failed = false;
for (const url of positionals) {
  for (const mode of MODES) {
    const { probe, file } = await shoot(browser, url, mode);
    const problems = problemsOf(probe);
    failed ||= problems.length > 0;
    console.log(
      `${problems.length ? "FAIL" : "ok  "} ${mode.name.padEnd(10)} gutter=${probe.gutterLeft}/${probe.gutterRight} ` +
        `overflow=${probe.overflow}/${probe.overflowWithScrollbar} font=${probe.font} h1=${JSON.stringify(probe.h1)} ${file}`,
    );
    for (const problem of problems) console.log(`     ${problem}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
