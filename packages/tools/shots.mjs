#!/usr/bin/env node
// @ts-check
// Renders pages in Playwright's Chromium at 1920 and 390 wide, light and dark,
// checks the layout rules every Siyahi page keeps, and writes one full-page
// PNG per page and mode. A page taller than 16,000px is written as segments
// <name>-1.png, <name>-2.png, … of equal height, which together cover it.
//
//   siyahi-shots <url | page.tsx>... [--out shots] [--gutter 16] [--font Geist]
//                [--chrome '[data-slot="sidebar"]'] [--wait-for h1] [--report]
//                [--widths 1920,390] [--script probe.mjs]
//
// --script names a module whose default export, async (page, mode) => data,
// runs in every mode once the page is ready, at the mode's screen size: it
// clicks, hovers or types with Playwright's page, and whatever it returns is
// printed as JSON. The checks then measure the page as the script left it. The
// full-page shot comes after the viewport grows to the page's height, which can
// undo a hover, so a script takes its own picture of an interaction, in the
// state it made: await card.screenshot({ path: `hover-${mode.name}.png` }).
// A page error or console error fails the mode, with or without a script.
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
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium, errors } from "playwright";

/** @typedef {{ name: string, width: number, height: number, dark: boolean }} Mode */
/** @typedef {{ gutterLeft: number | null, gutterRight: number | null, overflow: number, overflowWithScrollbar: number, clipped: string[], frozen: string[], font: string, fontLoaded: boolean, docHeight: number, h1: string | null }} Probe */
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
    widths: { type: "string", default: "1920,390" },
    script: { type: "string" },
  },
});
if (positionals.length === 0) {
  console.error(
    "usage: siyahi-shots <url | page.tsx>... [--out shots] [--gutter 16] [--font Geist] [--chrome <selector>] [--wait-for <selector>] [--report] [--widths 1920,390] [--script probe.mjs]",
  );
  process.exit(2);
}
const outDir = path.resolve(values.out);
const widths = values.widths.split(",").map(Number);
if (widths.some((width) => !Number.isInteger(width) || width < 240 || width > 3840)) {
  console.error("--widths must be comma-separated pixel widths between 240 and 3840");
  process.exit(2);
}
/** @type {Mode[]} */
const MODES = [...new Set(widths)].flatMap((width) =>
  [false, true].map((dark) => ({
    name: `${width}-${dark ? "dark" : "light"}`,
    width,
    height: width < 768 ? 844 : 1080,
    dark,
  })),
);
const minGutter = Number(values.gutter);
/**
 * Loads --script's default export, or exits 2 before any browser starts, as for any other bad argument.
 * @param {string} file
 * @returns {Promise<(page: import("playwright").Page, mode: Mode) => Promise<unknown>>}
 */
async function loadScript(file) {
  const module = await import(pathToFileURL(path.resolve(file)).href).catch((/** @type {Error} */ error) => {
    console.error(`--script ${file} did not load: ${error.message}`);
    process.exit(2);
  });
  if (typeof module.default !== "function") {
    console.error(`--script ${file} must export a default async function (page, mode)`);
    process.exit(2);
  }
  return module.default;
}
const act = values.script ? await loadScript(values.script) : undefined;
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
    const style = getComputedStyle(el);
    // Base UI keeps clipped controls for form submission; aria-hidden alone
    // does not mean a control (or its descendants) is visually hidden.
    const hiddenControl = el.matches('input[aria-hidden="true"],select[aria-hidden="true"],textarea[aria-hidden="true"]') &&
      (style.clipPath === "inset(50%)" || style.clip === "rect(0px, 0px, 0px, 0px)");
    return r.width > 0 && r.height > 0 && !el.closest(chrome) && style.visibility !== "hidden" && !hiddenControl;
  };
  // Tailwind's sr-only (and a closed dialog's title kept for screen readers) clips to nothing, so it has no place
  // in the gutter; the cut-off check still sees it, as a clipped visible control must not slip through.
  const screenReaderOnly = (el) => {
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.clip === "rect(0px, 0px, 0px, 0px)" || style.clipPath === "inset(50%)") return true;
    }
    return false;
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
    return shown(el) && !screenReaderOnly(el) && r.right > 0 && r.left < de.clientWidth && !scrollsSideways(el);
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
  const frozen = [];
  for (const table of document.querySelectorAll("table")) {
    let container = table.parentElement;
    while (container && !["auto", "scroll"].includes(getComputedStyle(container).overflowX)) container = container.parentElement;
    if (!container || container.scrollWidth <= container.clientWidth) continue;
    const cells = [...(table.querySelector("tbody tr")?.children ?? [])];
    const pinned = cells.filter((cell) => getComputedStyle(cell).position === "sticky");
    const occupied = pinned.reduce((sum, cell) => sum + cell.getBoundingClientRect().width, 0);
    if (pinned.length < cells.length && occupied > container.clientWidth / 2) {
      frozen.push("frozen columns occupy " + Math.round(occupied) + " of " + container.clientWidth + "px; unpin them in narrow space");
    }
  }
  const first = font.split(",")[0].trim().replace(/^["']|["']$/g, "");
  const h1 = document.querySelector("h1");
  return {
    gutterLeft: lefts.length ? Math.round(Math.min(...lefts)) : null,
    gutterRight: rights.length ? Math.round(Math.min(...rights)) : null,
    overflow,
    overflowWithScrollbar,
    clipped,
    frozen,
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
 * @returns {Promise<{ probe: Probe, ready: boolean, height: number, files: string[], data: unknown, browserErrors: string[] }>}
 */
async function shoot(browser, url, mode) {
  const context = await browser.newContext({
    viewport: { width: mode.width, height: mode.height },
    colorScheme: mode.dark ? "dark" : "light",
  });
  const page = await context.newPage();
  /** @type {string[]} */
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console error: ${message.text()} (${message.location().url})`);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  const ready = await page.waitForSelector(waitFor, { timeout: WAIT_FOR_TIMEOUT }).then(
    () => true,
    (error) => {
      if (error instanceof errors.TimeoutError) return false;
      throw error;
    },
  );
  await page.evaluate(SETTLE);
  const data = act && (await act(page, mode));
  if (act) await page.evaluate(SETTLE);
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
  return { probe, ready, height, files, data, browserErrors };
}

/**
 * @param {Probe} p
 * @param {boolean} ready whether --wait-for appeared
 * @param {string[]} browserErrors
 * @returns {string[]}
 */
function problemsOf(p, ready, browserErrors) {
  const problems = [...browserErrors];
  if (!ready) problems.push(`nothing matching ${waitFor} appeared within ${WAIT_FOR_TIMEOUT / 1000}s (--wait-for)`);
  if (p.gutterLeft !== null && p.gutterLeft < minGutter)
    problems.push(`left gutter is ${p.gutterLeft}px, under ${minGutter}px`);
  if (p.gutterRight !== null && p.gutterRight < minGutter)
    problems.push(`right gutter is ${p.gutterRight}px, under ${minGutter}px`);
  if (p.overflow > 0) problems.push(`document scrolls sideways by ${p.overflow}px`);
  if (p.overflowWithScrollbar > 0)
    problems.push(`scrolls sideways by ${p.overflowWithScrollbar}px once a scrollbar takes its width`);
  for (const what of p.clipped.slice(0, 5)) problems.push(what);
  problems.push(...p.frozen);
  if (p.clipped.length > 5) problems.push(`and ${p.clipped.length - 5} more cut off`);
  if (!p.font.startsWith(values.font)) problems.push(`body font is ${p.font}, not ${values.font}`);
  else if (!p.fontLoaded && !values.report) problems.push(`${p.font} is named but never loaded`);
  return problems;
}

// A page file (.tsx, .jsx) is built by siyahi-page into one HTML file in
// --out and shot as that file, as it will be hosted. Imported only then, so
// shooting URLs needs no Vite.
/** @type {string[]} */
const urls = [];
for (const arg of positionals) {
  if (!/\.[jt]sx$/.test(arg)) {
    urls.push(arg);
    continue;
  }
  const { buildPage } = await import("./page.mjs");
  const name = path.basename(arg).replace(/\.[jt]sx$/, "");
  const html = await buildPage({ page: arg, title: name, project: process.cwd() });
  const file = path.join(outDir, `${name}.html`);
  writeFileSync(file, html);
  urls.push(pathToFileURL(file).href);
}

const browser = await chromium.launch();
let failed = false;
for (const url of urls) {
  for (const mode of MODES) {
    const { probe, ready, height, files, data, browserErrors } = await shoot(browser, url, mode);
    const problems = problemsOf(probe, ready, browserErrors);
    failed ||= problems.length > 0;
    const font = values.report && !probe.fontLoaded ? `${probe.font} (report, system fallback allowed)` : probe.font;
    console.log(
      `${problems.length ? "FAIL" : "ok  "} ${mode.name.padEnd(10)} gutter=${probe.gutterLeft}/${probe.gutterRight} ` +
        `overflow=${probe.overflow}/${probe.overflowWithScrollbar} clipped=${probe.clipped.length} font=${font} h1=${JSON.stringify(probe.h1)} ` +
        `height=${height} ${files.join(" ")}`,
    );
    if (data !== undefined) console.log(`     data=${JSON.stringify(data)}`);
    for (const problem of problems) console.log(`     ${problem}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
