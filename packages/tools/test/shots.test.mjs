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

/**
 * Writes a page in Geist with the given body, runs siyahi-shots on it, and
 * returns the run with the width and height of each PNG it wrote per mode.
 * @param {string} body
 */
function shoot(body) {
  const dir = mkdtempSync(path.join(tmpdir(), "siyahi-shots-"));
  const page = path.join(dir, "page.html");
  writeFileSync(
    page,
    `<!doctype html><style>@font-face { font-family: Geist; src: url(data:font/woff2;base64,${geist}); }
    body { margin: 0; font-family: Geist; }</style>${body}`,
  );
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
});
