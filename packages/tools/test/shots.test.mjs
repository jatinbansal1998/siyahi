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

/**
 * Writes a page with the given body, in Geist unless `style` says otherwise,
 * runs siyahi-shots on it, and returns the run with the width and height of
 * each PNG it wrote per mode.
 * @param {string} body
 * @param {string} [style]
 */
function shoot(body, style = GEIST_PAGE) {
  const dir = mkdtempSync(path.join(tmpdir(), "siyahi-shots-"));
  const page = path.join(dir, "page.html");
  writeFileSync(page, `<!doctype html><style>${style}</style>${body}`);
  const out = path.join(dir, "shots");
  const run = spawnSync(process.execPath, [shots, pathToFileURL(page).href, "--out", out], { encoding: "utf8" });
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

  // report.css names Geist and loads no font file, so the viewer's own fonts draw it.
  it("passes a page with no @font-face that names the font, and says it is set in a system font", () => {
    const run = shoot(
      `<main style="padding: 16px"><h1>Report</h1></main>`,
      `body { margin: 0; font-family: Geist, system-ui, sans-serif; }`,
    );
    expect(run.status, run.output).toBe(0);
    expect(run.output).toContain("font=system (no @font-face)");
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
