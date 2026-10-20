#!/usr/bin/env node
// @ts-check
// Loads pages with a cold cache over a slow network, 1920 and 390 wide, and
// reports how far the page moves after its first paint: Cumulative Layout
// Shift, when the web font finished loading, the font-display in effect, and
// which text boxes moved between the first paint and fonts-ready.
//
//   siyahi-cls <url>... [--out cls] [--font "Geist Variable"] [--wait-for h1]
//              [--network slow-3g|none] [--hold-fonts] [--max-cls 0.01]
//
// The first shot is taken as soon as --wait-for is visible, the second once a
// --font face has loaded, the fonts are ready and the page has had a second to
// settle. --hold-fonts holds every woff2 response until the first shot is
// taken, so the fallback font always paints first: the worst case, a first
// visit on which the font arrives after the page. Each run writes
// <name>-<width>-first.png, -ready.png and -overlay.png, where text drawn in
// the same place in both shots is grey and anything that moved shows as red
// (first paint) and cyan (fonts ready) fringes.
//
// Fails when a page's CLS is above --max-cls or a text box inside the first
// screen moved. Boxes that moved further down are counted and listed, since
// they move only for a reader who has already scrolled.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */
/** @typedef {{ value: number, startTime: number, sources: { node: string, from: Rect, to: Rect }[] }} Shift */
/** @typedef {Record<string, Rect>} Boxes */
/** @typedef {{ shifts: Shift[], fontAt: number | null, display: string[], fcp: number | null }} Timeline */

const WIDTHS = [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];
// Chrome DevTools' "Slow 3G" preset: 400 kbit/s each way, 2 s round trips.
const NETWORKS = {
  "slow-3g": { offline: false, latency: 2000, downloadThroughput: 50_000, uploadThroughput: 50_000 },
  none: null,
};
// A throttled 1.5 MB bundle takes half a minute; the font another few seconds.
const TIMEOUT = 180_000;
// Shifts after the fonts are ready, such as a late data load, still count.
const SETTLE_MS = 1000;
// A box that moved less than this is antialiasing, not a shift.
const MOVE_PX = 0.5;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "cls" },
    font: { type: "string", default: "Geist Variable" },
    "wait-for": { type: "string", default: "h1" },
    network: { type: "string", default: "slow-3g" },
    "hold-fonts": { type: "boolean", default: false },
    "max-cls": { type: "string", default: "0.01" },
  },
});
if (positionals.length === 0 || !(values.network in NETWORKS)) {
  console.error(
    'usage: siyahi-cls <url>... [--out cls] [--font "Geist Variable"] [--wait-for h1] [--network slow-3g|none] [--hold-fonts] [--max-cls 0.01]',
  );
  process.exit(2);
}
const network = NETWORKS[/** @type {keyof typeof NETWORKS} */ (values.network)];
const maxCls = Number(values["max-cls"]);
const outDir = path.resolve(values.out);
mkdirSync(outDir, { recursive: true });

/** @param {string} url */
function slugOf(url) {
  const u = new URL(url);
  const slug = `${u.host}${u.pathname}${u.search}${u.hash}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return slug || "index";
}

// Runs in the page before any of its scripts, so no shift or font load is missed.
const OBSERVE = `(() => {
  const describe = (node) => {
    if (!(node instanceof Element)) return node ? node.nodeName : "?";
    const slot = node.getAttribute("data-slot");
    const text = (node.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return node.localName + (slot ? '[data-slot="' + slot + '"]' : "") + (text ? ' "' + text + '"' : "");
  };
  const rect = (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
  window.__cls = { shifts: [], fonts: [] };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls.shifts.push({
        value: e.value,
        startTime: e.startTime,
        sources: e.sources.map((s) => ({ node: describe(s.node), from: rect(s.previousRect), to: rect(s.currentRect) })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
  // Polled each frame: a face loaded from a preload never fires a loading
  // event, and loadingdone waits for every face in its batch.
  const seen = new Set();
  const poll = () => {
    for (const f of document.fonts) {
      if (f.status !== "loaded" || seen.has(f)) continue;
      seen.add(f);
      window.__cls.fonts.push({ family: f.family.replace(/["']/g, ""), at: performance.now() });
    }
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
})()`;

/** @param {string} family */
const fontLoaded = (family) =>
  `[...document.fonts].some((f) => f.family.replace(/["']/g, "") === ${JSON.stringify(family)} && f.status === "loaded")`;

// Every element that holds text of its own, keyed by tag, text and how many
// times that pair came before, so the two shots' boxes can be paired.
const BOXES = `(() => {
  const boxes = {};
  const seen = {};
  for (const el of document.body.querySelectorAll("*")) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const base = el.localName + " " + el.textContent.trim().replace(/\\s+/g, " ").slice(0, 40);
    seen[base] = (seen[base] || 0) + 1;
    boxes[base + " #" + seen[base]] = { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  return boxes;
})()`;

/** @param {string} family */
const timeline = (family) => `(() => {
  const faces = window.__cls.fonts.filter((f) => f.family === ${JSON.stringify(family)});
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  return {
    shifts: window.__cls.shifts,
    fontAt: faces.length ? Math.min(...faces.map((f) => f.at)) : null,
    display: [...new Set([...document.fonts].filter((f) => f.family.replace(/["']/g, "") === ${JSON.stringify(family)} && f.status === "loaded").map((f) => f.display))],
    fcp: fcp ? fcp.startTime : null,
  };
})()`;

const SETTLE = `(async () => {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;

/**
 * CLS as web-vitals defines it: the largest sum of shifts in a session window,
 * a run of shifts less than 1 s apart and at most 5 s long.
 * @param {Shift[]} shifts
 */
function clsOf(shifts) {
  let best = 0;
  let sum = 0;
  let start = -Infinity;
  let last = -Infinity;
  for (const { value, startTime } of shifts.toSorted((a, b) => a.startTime - b.startTime)) {
    if (startTime - last > 1000 || startTime - start > 5000) {
      sum = 0;
      start = startTime;
    }
    sum += value;
    last = startTime;
    best = Math.max(best, sum);
  }
  return best;
}

/**
 * Pairs the boxes of the two shots and returns the ones that moved or resized.
 * @param {Boxes} first
 * @param {Boxes} ready
 */
function movedBoxes(first, ready) {
  const moved = [];
  let paired = 0;
  for (const [key, a] of Object.entries(first)) {
    const b = ready[key];
    if (!b) continue;
    paired++;
    const by = Math.max(
      Math.abs(b.x - a.x),
      Math.abs(b.y - a.y),
      Math.abs(b.width - a.width),
      Math.abs(b.height - a.height),
    );
    if (by > MOVE_PX) moved.push({ key, by, from: a, to: b });
  }
  return { paired, moved: moved.toSorted((a, b) => b.by - a.by) };
}

/**
 * Draws the two shots into one image, fonts-ready in the red channel and the
 * first paint in green and blue, so ink only the first paint has shows red,
 * ink only fonts-ready has shows cyan; and counts the pixels that differ.
 * @param {import("playwright").Page} page an unthrottled page to draw in
 * @param {Buffer} first
 * @param {Buffer} ready
 * @returns {Promise<{ overlay: Buffer, changed: number }>}
 */
async function overlayOf(page, first, ready) {
  const { png, changed } = await page.evaluate(
    async ([a, b]) => {
      const [one, two] = /** @type {[ImageBitmap, ImageBitmap]} */ (
        await Promise.all(
          [a, b].map(async (base64) =>
            createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob()),
          ),
        )
      );
      const canvas = new OffscreenCanvas(one.width, one.height);
      const context = /** @type {OffscreenCanvasRenderingContext2D} */ (canvas.getContext("2d"));
      context.drawImage(one, 0, 0);
      const x = context.getImageData(0, 0, one.width, one.height);
      context.drawImage(two, 0, 0);
      const y = context.getImageData(0, 0, one.width, one.height);
      let differ = 0;
      for (let i = 0; i < x.data.length; i += 4) {
        const lx = x.data.subarray(i, i + 3).reduce((sum, v) => sum + v, 0) / 3;
        const ly = y.data.subarray(i, i + 3).reduce((sum, v) => sum + v, 0) / 3;
        if (Math.abs(lx - ly) > 16) differ++;
        y.data[i] = ly;
        y.data[i + 1] = lx;
        y.data[i + 2] = lx;
      }
      context.putImageData(y, 0, 0);
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { png: btoa(binary), changed: differ / (x.data.length / 4) };
    },
    [first.toString("base64"), ready.toString("base64")],
  );
  return { overlay: Buffer.from(png, "base64"), changed };
}

/**
 * @param {import("playwright").Browser} browser
 * @param {string} url
 * @param {{ width: number, height: number }} viewport
 */
async function measure(browser, url, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  const cdp = await context.newCDPSession(page);
  if (network) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", network);
  }
  // Playwright's own screenshot waits for web fonts, which would hide the
  // very paint this script is after; the DevTools capture takes the frame as is.
  const shot = async () => Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64");
  const held = Promise.withResolvers();
  if (values["hold-fonts"])
    await page.route(/\.woff2(\?|$)/, async (route) => {
      await held.promise;
      await route.continue();
    });
  await page.addInitScript(OBSERVE);
  await page.goto(url, { waitUntil: "commit", timeout: TIMEOUT });
  await page.waitForSelector(values["wait-for"]);
  /** @type {Boxes} */
  const firstBoxes = await page.evaluate(BOXES);
  const fontAtFirstShot = await page.evaluate(fontLoaded(values.font));
  const firstShot = await shot();
  held.resolve(undefined);
  await page.waitForFunction(fontLoaded(values.font));
  await page.evaluate(SETTLE);
  await page.waitForTimeout(SETTLE_MS);
  /** @type {Boxes} */
  const readyBoxes = await page.evaluate(BOXES);
  const readyShot = await shot();
  /** @type {Timeline} */
  const times = await page.evaluate(timeline(values.font));
  await context.close();
  return { firstShot, readyShot, fontAtFirstShot, firstBoxes, readyBoxes, times };
}

/** @param {number | null} ms */
const seconds = (ms) => (ms === null ? "n/a" : `${(ms / 1000).toFixed(2)}s`);
/** @param {Rect} r */
const box = (r) => `${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`;

const browser = await chromium.launch();
const drawing = await browser.newPage();
let failed = false;
for (const url of positionals) {
  for (const viewport of WIDTHS) {
    const run = await measure(browser, url, viewport);
    const cls = clsOf(run.times.shifts);
    const { paired, moved } = movedBoxes(run.firstBoxes, run.readyBoxes);
    const inView = moved.filter((m) => m.from.y < viewport.height && m.from.y + m.from.height > 0);
    const { overlay, changed } = await overlayOf(drawing, run.firstShot, run.readyShot);
    const base = path.join(outDir, `${slugOf(url)}-${viewport.width}`);
    writeFileSync(`${base}-first.png`, run.firstShot);
    writeFileSync(`${base}-ready.png`, run.readyShot);
    writeFileSync(`${base}-overlay.png`, overlay);
    const bad = cls > maxCls || inView.length > 0;
    failed ||= bad;
    console.log(
      `${bad ? "FAIL" : "ok  "} ${url} ${viewport.width}: cls=${cls.toFixed(4)} shifts=${run.times.shifts.length} ` +
        `fcp=${seconds(run.times.fcp)} font=${seconds(run.times.fontAt)} display=${run.times.display.join("/") || "n/a"} ` +
        `font-at-first-paint=${run.fontAtFirstShot ? "loaded" : "not yet"} moved=${moved.length}/${paired} in-view=${inView.length} ` +
        `pixels-changed=${(changed * 100).toFixed(2)}%`,
    );
    console.log(`     ${base}-{first,ready,overlay}.png`);
    for (const shift of run.times.shifts.filter((s) => s.value >= 0.001))
      for (const source of shift.sources)
        console.log(
          `     shift ${shift.value.toFixed(4)} at ${seconds(shift.startTime)}: ${source.node} ${box(source.from)} -> ${box(source.to)}`,
        );
    for (const m of [...inView, ...moved.filter((entry) => !inView.includes(entry))].slice(0, 5))
      console.log(`     moved ${m.by.toFixed(1)}px: ${m.key} ${box(m.from)} -> ${box(m.to)}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
