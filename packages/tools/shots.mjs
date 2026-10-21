#!/usr/bin/env node
// @ts-check
// Renders pages in Playwright's Chromium at 1920 and 390 wide, light and dark,
// checks the layout rules every Siyahi page keeps, and writes one full-page
// PNG per page and mode. A page taller than 16,000px is written as segments
// <name>-1.png, <name>-2.png, … of equal height, which together cover it.
//
//   siyahi-shots <url>... [--out shots] [--gutter 16] [--font Geist]
//                [--chrome '[data-slot="sidebar"]'] [--wait-for h1] [--report]
//
// Measures only once --wait-for (by default the page's h1) is visible, two
// animation frames have passed and the fonts are ready: a page that renders
// after the network goes quiet would otherwise be measured, and shot, at one
// screen tall.
//
// Checks: a gutter of at least --gutter px on both sides of visible text and
// cards, no sideways document scroll (also with a classic scrollbar taking its
// width), no text or control cut off at the side by a box that hides its
// overflow (a card does; the document scroll check cannot see what it cuts),
// and --font as the loaded body font. --report is for static HTML
// reports, which load no font file by design: the body must still name --font
// first, but the viewer's installed font or the system fallback may draw it.
// Exempt from the gutter: content
// inside a box that scrolls sideways, and anything inside --chrome, which by
// default is only the shadcn sidebar, flush to the edge by design. The font
// default is Siyahi's; other pages pass their own family.
//
// The capture first grows the viewport to the page's height and waits, so
// charts that redraw on resize settle before the picture is taken; a
// stitched full-page capture catches them mid-animation. Segments are cut
// from that one full-height render, so sticky and fixed parts sit where they
// would in a single shot.
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { chromium, errors } from "playwright";

/** @typedef {{ name: string, width: number, height: number, dark: boolean }} Mode */
/** @typedef {{ gutterLeft: number | null, gutterRight: number | null, overflow: number, overflowWithScrollbar: number, clipped: string[], font: string, fontLoaded: boolean, docHeight: number, h1: string | null }} Probe */

/** @type {Mode[]} */
const MODES = [
  { name: "1920-light", width: 1920, height: 1080, dark: false },
  { name: "1920-dark", width: 1920, height: 1080, dark: true },
  { name: "390-light", width: 390, height: 844, dark: false },
  { name: "390-dark", width: 390, height: 844, dark: true },
];
// How long --wait-for may take to appear before the mode fails.
const WAIT_FOR_TIMEOUT = 15_000;
// Tallest PNG written. Headless Chromium renders taller pages, but many image
// viewers draw through a GPU texture capped at 16,384px.
const SEGMENT_MAX = 16000;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "shots" },
    gutter: { type: "string", default: "16" },
    font: { type: "string", default: "Geist" },
    chrome: { type: "string", default: '[data-slot="sidebar"]' },
    "wait-for": { type: "string", default: "h1" },
    report: { type: "boolean", default: false },
  },
});
if (positionals.length === 0) {
  console.error(
    "usage: siyahi-shots <url>... [--out shots] [--gutter 16] [--font Geist] [--chrome <selector>] [--wait-for <selector>] [--report]",
  );
  process.exit(2);
}
const outDir = path.resolve(values.out);
const minGutter = Number(values.gutter);
const waitFor = values["wait-for"];
mkdirSync(outDir, { recursive: true });

/** @param {string} url */
function slugOf(url) {
  const u = new URL(url);
  const slug = `${u.pathname}${u.hash}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return slug || "index";
}

// Runs in the page. Kept as a string so the bundled code is exactly what runs.
const PROBE = `((chrome) => {
  const de = document.documentElement;
  const scrollsSideways = (el) => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const o = getComputedStyle(e).overflowX;
      if ((o === "auto" || o === "scroll") && e.scrollWidth > e.clientWidth) return true;
    }
    return false;
  };
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest(chrome) && getComputedStyle(el).visibility !== "hidden";
  };
  // Pixels of el cut off at the side by an ancestor that hides its overflow,
  // and how it hides it, up to the nearest one that scrolls, which shows the
  // rest on scroll.
  const cutOff = (el) => {
    const r = el.getBoundingClientRect();
    for (let a = el.parentElement; a; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX;
      if (o === "auto" || o === "scroll") return 0;
      if (o !== "hidden" && o !== "clip") continue;
      const left = a.getBoundingClientRect().left + a.clientLeft;
      const cut = Math.max(left - r.left, r.right - (left + a.clientWidth));
      if (cut >= 1) return { px: Math.round(cut), overflow: o };
    }
    return null;
  };
  const visible = [...document.querySelectorAll('h1,h2,h3,h4,p,li,td,th,[data-slot="card"]')].filter((el) => {
    const r = el.getBoundingClientRect();
    return shown(el) && r.right > 0 && r.left < de.clientWidth && !scrollsSideways(el);
  });
  // Badges, card titles and descriptions are spans and divs, which the tag list misses.
  const clipped = [...document.querySelectorAll('h1,h2,h3,h4,p,li,td,th,a,button,input,select,textarea,label,[data-slot="badge"],[data-slot="card-title"],[data-slot="card-description"]')]
    .filter(shown)
    .map((el) => ({ el, cut: cutOff(el) }))
    .filter(({ cut }) => cut)
    .map(({ el, cut }) => el.tagName.toLowerCase() + " " + JSON.stringify(el.textContent.trim().slice(0, 40)) + " by " + cut.px + "px is cut off by an overflow: " + cut.overflow + " box");
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
    clipped,
    font: first,
    fontLoaded: document.fonts.check('16px "' + first + '"') && [...document.fonts].some((f) => f.family.replace(/["']/g, "") === first && f.status === "loaded"),
    docHeight: de.scrollHeight,
    h1: h1 ? h1.textContent.trim().slice(0, 60) : null,
  };
})(${JSON.stringify(values.chrome)})`;

const SETTLE = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;

/**
 * Deletes what an earlier run wrote for this page and mode, so a page that
 * shrank leaves no stale segment behind.
 * @param {string} base
 */
function clearShots(base) {
  // base is letters, digits and dashes (slugOf and the mode name), so it is safe in a pattern.
  const earlier = new RegExp(`^${base}(-\\d+)?\\.png$`);
  for (const name of readdirSync(outDir)) if (earlier.test(name)) rmSync(path.join(outDir, name));
}

/**
 * @param {import("playwright").Browser} browser
 * @param {string} url
 * @param {Mode} mode
 * @returns {Promise<{ probe: Probe, ready: boolean, height: number, files: string[] }>}
 */
async function shoot(browser, url, mode) {
  const context = await browser.newContext({
    viewport: { width: mode.width, height: mode.height },
    colorScheme: mode.dark ? "dark" : "light",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const ready = await page.waitForSelector(waitFor, { timeout: WAIT_FOR_TIMEOUT }).then(
    () => true,
    (error) => {
      if (error instanceof errors.TimeoutError) return false;
      throw error;
    },
  );
  await page.evaluate(SETTLE);
  /** @type {Probe} */
  const probe = await page.evaluate(PROBE);
  const height = Math.max(probe.docHeight, mode.height);
  await page.setViewportSize({ width: mode.width, height });
  await page.waitForTimeout(1500);
  await page.evaluate(SETTLE);
  const base = `${slugOf(url)}-${mode.name}`;
  clearShots(base);
  const count = Math.ceil(height / SEGMENT_MAX);
  const segment = Math.ceil(height / count);
  const files = [];
  for (let i = 0; i < count; i++) {
    const file = path.join(outDir, count === 1 ? `${base}.png` : `${base}-${i + 1}.png`);
    const y = i * segment;
    await page.screenshot({ path: file, clip: { x: 0, y, width: mode.width, height: Math.min(segment, height - y) } });
    files.push(file);
  }
  await context.close();
  return { probe, ready, height, files };
}

/**
 * @param {Probe} p
 * @param {boolean} ready whether --wait-for appeared
 * @returns {string[]}
 */
function problemsOf(p, ready) {
  const problems = [];
  if (!ready) problems.push(`nothing matching ${waitFor} appeared within ${WAIT_FOR_TIMEOUT / 1000}s (--wait-for)`);
  if (p.gutterLeft !== null && p.gutterLeft < minGutter)
    problems.push(`left gutter is ${p.gutterLeft}px, under ${minGutter}px`);
  if (p.gutterRight !== null && p.gutterRight < minGutter)
    problems.push(`right gutter is ${p.gutterRight}px, under ${minGutter}px`);
  if (p.overflow > 0) problems.push(`document scrolls sideways by ${p.overflow}px`);
  if (p.overflowWithScrollbar > 0)
    problems.push(`scrolls sideways by ${p.overflowWithScrollbar}px once a scrollbar takes its width`);
  for (const what of p.clipped.slice(0, 5)) problems.push(what);
  if (p.clipped.length > 5) problems.push(`and ${p.clipped.length - 5} more cut off`);
  if (!p.font.startsWith(values.font)) problems.push(`body font is ${p.font}, not ${values.font}`);
  else if (!p.fontLoaded && !values.report) problems.push(`${p.font} is named but never loaded`);
  return problems;
}

const browser = await chromium.launch();
let failed = false;
for (const url of positionals) {
  for (const mode of MODES) {
    const { probe, ready, height, files } = await shoot(browser, url, mode);
    const problems = problemsOf(probe, ready);
    failed ||= problems.length > 0;
    const font = values.report && !probe.fontLoaded ? `${probe.font} (report, system fallback allowed)` : probe.font;
    console.log(
      `${problems.length ? "FAIL" : "ok  "} ${mode.name.padEnd(10)} gutter=${probe.gutterLeft}/${probe.gutterRight} ` +
        `overflow=${probe.overflow}/${probe.overflowWithScrollbar} clipped=${probe.clipped.length} font=${font} h1=${JSON.stringify(probe.h1)} ` +
        `height=${height} ${files.join(" ")}`,
    );
    for (const problem of problems) console.log(`     ${problem}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
