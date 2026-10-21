import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const shots = fileURLToPath(new URL("../shots.mjs", import.meta.url));
// The page's font must be a loaded Geist for the font check to pass.
const geist = readFileSync(
  fileURLToPath(import.meta.resolve("@fontsource-variable/geist/files/geist-latin-wght-normal.woff2")),
).toString("base64");
const MODES = [
  { name: "1920-light", width: 1920 },
  { name: "1920-dark", width: 1920 },
  { name: "390-light", width: 390 },
  { name: "390-dark", width: 390 },
];

const GEIST_PAGE = `@font-face { font-family: Geist; src: url(data:font/woff2;base64,${geist}); }
  body { margin: 0; font-family: Geist; }`;

// A card header in stock shadcn's shape: the title and a two-item toggle in
// columns, inside a card that hides its overflow. The document never scrolls
// sideways, so only the cut-off check can see the toggle run past the edge.
/** @param {string} columns grid-template-columns of the header */
const card = (columns) => `<main style="padding: 16px"><h1>Card</h1>
  <div style="overflow: hidden; border: 1px solid">
    <div style="display: grid; grid-template-columns: ${columns}">
      <p style="min-width: 120px">Return against the index</p>
      <div style="display: flex"><button style="width: 150px">Cumulative return</button><button style="width: 150px">Monthly return</button></div>
    </div>
  </div></main>`;

/**
 * Writes a page with the given body, in Geist unless `style` says otherwise,
 * runs siyahi-shots on it, and returns the run with the width and height of
 * each PNG it wrote per mode.
 * @param {string} body
 * @param {string} [style]
 * @param {string[]} [flags] more siyahi-shots arguments
 */
function shoot(body, style = GEIST_PAGE, flags = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "siyahi-shots-"));
  const page = path.join(dir, "page.html");
  writeFileSync(page, `<!doctype html><style>${style}</style>${body}`);
  const out = path.join(dir, "shots");
  const run = spawnSync(process.execPath, [shots, pathToFileURL(page).href, "--out", out, ...flags], {
    encoding: "utf8",
  });
  const pngs = readdirSync(out).toSorted();
  /** @param {string} mode */
  const sizesOf = (mode) =>
    pngs
      .filter((name) => name.includes(`-${mode}`))
      .map((name) => {
        const png = readFileSync(path.join(out, name));
        return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
      });
  return { status: run.status, output: run.stdout + run.stderr, sizesOf };
}

describe("siyahi-shots", { timeout: 120_000 }, () => {
  it("writes a page taller than 16,000px as segments that cover all of it", () => {
    const run = shoot(`<main style="box-sizing: border-box; height: 25000px; padding: 16px"><h1>Tall</h1></main>`);
    expect(run.status, run.output).toBe(0);
    for (const { name, width } of MODES) {
      expect(run.sizesOf(name)).toEqual([
        { width, height: 12500 },
        { width, height: 12500 },
      ]);
    }
  });

  it("waits for content that arrives after the network goes quiet", () => {
    const late = `<main style="box-sizing: border-box; height: 3000px; padding: 16px"><h1>Late</h1></main>`;
    const run = shoot(
      `<script>setTimeout(() => document.body.insertAdjacentHTML("beforeend", '${late}'), 2000)</script>`,
    );
    expect(run.status, run.output).toBe(0);
    for (const { name, width } of MODES) expect(run.sizesOf(name)).toEqual([{ width, height: 3000 }]);
  });

  it("fails a page whose card cuts off a toggle at 390", () => {
    const run = shoot(card("1fr auto"));
    expect(run.status, run.output).toBe(1);
    expect(run.output).toMatch(/390-light .*clipped=1/);
    expect(run.output).toContain('button "Monthly return" by 64px is cut off by an overflow: hidden box');
    expect(run.output).toMatch(/ok {3}1920-light .*clipped=0/);
  });

  it("passes the same card with the toggle under the title", () => {
    const run = shoot(card("1fr"));
    expect(run.status, run.output).toBe(0);
  });

  // A page that names Geist and loads no font file: an app whose font CSS
  // never arrived, or a static report on report.css.
  const UNLOADED = `body { margin: 0; font-family: Geist, system-ui, sans-serif; }`;

  it("fails a page that names the font and loads no font file", () => {
    const run = shoot(`<main style="padding: 16px"><h1>No font</h1></main>`, UNLOADED);
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("Geist is named but never loaded");
  });

  it("passes the same page with --report, and says the flag allowed the fallback", () => {
    const run = shoot(`<main style="padding: 16px"><h1>Report</h1></main>`, UNLOADED, ["--report"]);
    expect(run.status, run.output).toBe(0);
    expect(run.output).toContain("font=Geist (report, system fallback allowed)");
  });

  it("fails a page whose @font-face for the font never loads", () => {
    const run = shoot(
      `<main style="padding: 16px"><h1>Broken</h1></main>`,
      `@font-face { font-family: Geist; src: url(missing.woff2); } body { margin: 0; font-family: Geist, sans-serif; }`,
    );
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("Geist is named but never loaded");
  });
});
