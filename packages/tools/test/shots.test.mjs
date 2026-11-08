import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";

const shots = fileURLToPath(new URL("../shots.mjs", import.meta.url));
const execFileAsync = promisify(execFile);
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
 * The RGB of a PNG's top-left pixel. Every PNG filter stores the first pixel of
 * the first row unchanged, so inflating the image data is all it takes.
 * @param {Buffer} png
 */
function topLeftPixel(png) {
  const data = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    if (png.toString("latin1", at + 4, at + 8) === "IDAT") data.push(png.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const [, r, g, b] = inflateSync(Buffer.concat(data));
  return [r, g, b];
}

/**
 * Writes a page with the given body, in Geist unless `style` says otherwise,
 * runs siyahi-shots on it, and returns the run with the width and height of
 * each PNG it wrote per mode.
 * @param {string} body
 * @param {string} [style]
 * @param {string[]} [flags] more siyahi-shots arguments
 */
async function shoot(body, style = GEIST_PAGE, flags = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "siyahi-shots-"));
  const page = path.join(dir, "page.html");
  writeFileSync(page, `<!doctype html><style>${style}</style>${body}`);
  const out = path.join(dir, "shots");
  mkdirSync(out);
  // execFile rejects on a non-zero exit, with the exit code and output on the error.
  const run = await execFileAsync(process.execPath, [shots, pathToFileURL(page).href, "--out", out, ...flags]).then(
    ({ stdout, stderr }) => ({ status: 0, stdout, stderr }),
    (/** @type {{ code: number, stdout: string, stderr: string }} */ error) => ({ status: error.code, ...error }),
  );
  const pngs = readdirSync(out).toSorted();
  /** @param {string} mode */
  const sizesOf = (mode) =>
    pngs
      .filter((name) => name.includes(`-${mode}`))
      .map((name) => {
        const png = readFileSync(path.join(out, name));
        return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
      });
  /** @param {string} mode */
  const topLeftOf = (mode) => {
    const name = pngs.find((file) => file.includes(`-${mode}`));
    return name && topLeftPixel(readFileSync(path.join(out, name)));
  };
  return { status: run.status, output: run.stdout + run.stderr, sizesOf, topLeftOf };
}

/**
 * Writes a --script module whose function runs the given statements with `page` and `mode`, and returns its path.
 * @param {string} steps
 */
function script(steps) {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "siyahi-shots-script-")), "steps.mjs");
  writeFileSync(file, `export default async (page, mode) => { ${steps} };`);
  return file;
}

// Each case is its own siyahi-shots process, mostly waiting on the page to settle, so they run side by side.
describe.concurrent("siyahi-shots", { timeout: 120_000 }, () => {
  it("fails a table whose frozen column occupies most of its scrolling window", async () => {
    const run = await shoot(
      `<main style="padding:16px"><h1>Frozen table</h1><div style="overflow:auto"><table style="width:1200px;table-layout:fixed"><tr><td style="position:sticky;left:0;box-sizing:border-box;width:300px;background:white">Instrument</td><td>Value</td><td>Change</td></tr></table></div></main>`,
    );
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("frozen columns occupy 300 of 358px");
  });

  it("captures caller-selected intermediate widths in both schemes", async () => {
    const run = await shoot('<main style="padding:16px"><h1>Tablet</h1></main>', GEIST_PAGE, ["--widths", "768,1366"]);
    expect(run.status, run.output).toBe(0);
    expect(run.sizesOf("768-light")).toEqual([{ width: 768, height: 1080 }]);
    expect(run.sizesOf("1366-dark")).toEqual([{ width: 1366, height: 1080 }]);
    expect(run.sizesOf("390-light")).toEqual([]);
  });

  it("writes a page taller than 16,000px as segments that cover all of it", async () => {
    const run = await shoot(
      `<main style="box-sizing: border-box; height: 25000px; padding: 16px"><h1>Tall</h1></main>`,
    );
    expect(run.status, run.output).toBe(0);
    for (const { name, width } of MODES) {
      expect(run.sizesOf(name)).toEqual([
        { width, height: 12500 },
        { width, height: 12500 },
      ]);
    }
  });

  it("waits for content that arrives after the network goes quiet", async () => {
    const late = `<main style="box-sizing: border-box; height: 3000px; padding: 16px"><h1>Late</h1></main>`;
    const run = await shoot(
      `<script>setTimeout(() => document.body.insertAdjacentHTML("beforeend", '${late}'), 2000)</script>`,
    );
    expect(run.status, run.output).toBe(0);
    for (const { name, width } of MODES) expect(run.sizesOf(name)).toEqual([{ width, height: 3000 }]);
  });

  it("fails a page whose card cuts off a toggle at 390", async () => {
    const run = await shoot(card("1fr auto"));
    expect(run.status, run.output).toBe(1);
    expect(run.output).toMatch(/390-light .*clipped=1/);
    expect(run.output).toContain('button "Monthly return" by 64px is cut off by an overflow: hidden box');
    expect(run.output).toMatch(/ok {3}1920-light .*clipped=0/);
  });

  it("ignores aria-hidden form controls clipped for form submission", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>Select</h1>
      <div style="margin-left: 32px; overflow: hidden">
        <button>All accounts</button>
        <input aria-hidden="true" style="position: fixed; top: 0; left: 0; width: 1px; height: 1px; clip-path: inset(50%)">
        <select aria-hidden="true" style="position: fixed; top: 0; left: 0; width: 1px; height: 1px; clip: rect(0, 0, 0, 0)"><option>All</option></select>
        <textarea aria-hidden="true" style="position: fixed; top: 0; left: 0; width: 1px; height: 1px; clip-path: inset(50%)"></textarea>
      </div></main>`);
    expect(run.status, run.output).toBe(0);
    for (const { name } of MODES) expect(run.output).toMatch(new RegExp(name + " .*clipped=0"));
  });

  it("leaves screen-reader-only text out of the gutter, as a closed dialog's title", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>Page</h1>
      <div style="position: absolute; left: 0; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0)">
        <h2>Search the catalogue</h2><p>Find a page by name</p>
      </div></main>`);
    expect(run.status, run.output).toBe(0);
    for (const { name } of MODES) expect(run.output).toMatch(new RegExp(name + " .*gutter=16/"));
  });

  it("still checks visible aria-hidden controls and descendants of aria-hidden containers", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>Visible controls</h1>
      <div style="width: 100px; overflow: hidden">
        <input aria-hidden="true" style="width: 200px">
        <div aria-hidden="true"><button style="width: 200px">Visible descendant</button></div>
        <input style="position: fixed; top: 0; left: 0; width: 1px; height: 1px; clip-path: inset(50%)">
      </div></main>`);
    expect(run.status, run.output).toBe(1);
    for (const { name } of MODES) expect(run.output).toMatch(new RegExp(name + " .*clipped=3"));
    expect(run.output).toContain('button "Visible descendant" by 100px is cut off');
  });

  it("passes the same card with the toggle under the title", async () => {
    const run = await shoot(card("1fr"));
    expect(run.status, run.output).toBe(0);
  });

  it("fails a card whose lone badge in the action runs past the edge at 390", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>Card</h1>
      <div style="overflow: clip; border: 1px solid">
        <div style="display: grid; grid-template-columns: 1fr auto">
          <div data-slot="card-title" style="min-width: 120px">Return</div>
          <div data-slot="card-action"><span data-slot="badge" style="display: inline-block; width: 300px">Beats the index</span></div>
        </div>
      </div></main>`);
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain('span "Beats the index" by 64px is cut off by an overflow: clip box');
  });

  it("runs --script in every mode, prints what it returns and measures the page as the script left it", async () => {
    const run = await shoot(
      `<main style="padding: 16px"><h1>Details</h1>
        <button onclick="document.querySelector('section').hidden = false">Show details</button>
        <section hidden style="position: absolute; top: 0; height: 3000px"><p>Opened by the script</p></section></main>`,
      GEIST_PAGE,
      [
        "--script",
        script(`await page.getByRole("button", { name: "Show details" }).click();
          return { mode: mode.name, text: await page.locator("p").innerText() };`),
      ],
    );
    expect(run.status, run.output).toBe(0);
    expect(run.output).toContain('data={"mode":"390-dark","text":"Opened by the script"}');
    expect(run.sizesOf("1920-light")).toEqual([{ width: 1920, height: 3000 }]);
  });

  it("exits 2 when --script is missing or does not parse, as for any other bad argument", async () => {
    const broken = path.join(mkdtempSync(path.join(tmpdir(), "siyahi-shots-script-")), "broken.mjs");
    writeFileSync(broken, "export default async (page => {");
    for (const file of [path.join(tmpdir(), "no-such-script.mjs"), broken]) {
      const run = await shoot('<main style="padding: 16px"><h1>Page</h1></main>', GEIST_PAGE, ["--script", file]);
      expect(run.status, run.output).toBe(2);
      expect(run.output).toContain(`--script ${file} did not load`);
    }
  });

  it("measures a page --script ran on at the mode's screen height, not the page's", async () => {
    // The side padding shrinks with the screen's height: 8px on an 844px phone, 30px on a screen 3000px tall.
    const run = await shoot(
      `<main style="box-sizing: border-box; height: 3000px; padding: 16px calc(30px - (3000px - 100vh) / 100)"><h1>Tall</h1><p>Body text</p></main>`,
      GEIST_PAGE,
      ["--script", script(""), "--widths", "390"],
    );
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("left gutter is 8px");
  });

  it("shoots a chart that redraws on the resize only once its marks stop moving", async () => {
    // As a chart does when the capture grows the viewport: a bar animates for a second, then the page turns green.
    const run = await shoot(
      `<main style="box-sizing: border-box; height: 3000px; padding: 16px"><h1>Chart</h1>
        <svg width="300" height="40"><rect id="bar" height="40" width="0"></rect></svg></main>
        <script>
          addEventListener("resize", () => {
            let start;
            const grow = (now) => {
              start ??= now;
              const t = Math.min((now - start) / 1000, 1);
              document.getElementById("bar").setAttribute("width", String(300 * t));
              if (t < 1) requestAnimationFrame(grow);
              else document.body.style.background = "rgb(0, 128, 0)";
            };
            requestAnimationFrame(grow);
          }, { once: true });
        </script>`,
      `${GEIST_PAGE} body { background: rgb(255, 0, 0); }`,
      ["--widths", "390"],
    );
    expect(run.status, run.output).toBe(0);
    expect(run.topLeftOf("390-light")).toEqual([0, 128, 0]);
  });

  it("fails a page that throws or logs a console error", async () => {
    const run = await shoot(
      `<main style="padding: 16px"><h1>Broken</h1></main>
        <script>console.error("no rows for the chart"); throw new Error("chart failed to load");</script>`,
    );
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("page error: chart failed to load");
    expect(run.output).toContain("console error: no rows for the chart");
  });

  // A page that names Geist and loads no font file: an app whose font CSS
  // never arrived, or a static report on report.css.
  const UNLOADED = `body { margin: 0; font-family: Geist, system-ui, sans-serif; }`;

  it("fails a page that names the font and loads no font file", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>No font</h1></main>`, UNLOADED);
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("Geist is named but never loaded");
  });

  it("passes the same page with --report, and says the flag allowed the fallback", async () => {
    const run = await shoot(`<main style="padding: 16px"><h1>Report</h1></main>`, UNLOADED, ["--report"]);
    expect(run.status, run.output).toBe(0);
    expect(run.output).toContain("font=Geist (report, system fallback allowed)");
  });

  it("fails a page whose @font-face for the font never loads", async () => {
    const run = await shoot(
      `<main style="padding: 16px"><h1>Broken</h1></main>`,
      `@font-face { font-family: Geist; src: url(missing.woff2); } body { margin: 0; font-family: Geist, sans-serif; }`,
    );
    expect(run.status, run.output).toBe(1);
    expect(run.output).toContain("Geist is named but never loaded");
  });
});
