import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const cls = fileURLToPath(new URL("../cls.mjs", import.meta.url));
const geist = readFileSync(
  fileURLToPath(import.meta.resolve("@fontsource-variable/geist/files/geist-latin-wght-normal.woff2")),
);
const TEXT = "Numbers, money and times default to Indian English, rupees and IST. ".repeat(6);

/**
 * Serves a page whose text is set in Geist, loaded over the network as Late,
 * with the given fallback. The content appears only once Same, an inline copy
 * of Geist, is ready, so a first paint in Same is already in Geist's metrics.
 * Runs siyahi-cls on the page with Late held back until that paint.
 * @param {string} fallback a CSS family name; "Same" is Geist itself, inline
 * @param {number} [top] px of empty space above the text, to push it off the first screen
 */
async function measure(fallback, top = 0) {
  const server = createServer((request, response) => {
    if (request.url === "/geist.woff2") return response.end(geist);
    response.setHeader("content-type", "text/html");
    response.end(`<!doctype html><style>
      @font-face { font-family: Late; src: url(/geist.woff2); }
      @font-face { font-family: Same; src: url(data:font/woff2;base64,${geist.toString("base64")}); }
      body { margin: 0; padding: 16px; font: 16px/1.5 Late, ${fallback}; }
      p { max-width: 300px; }
      h1 { margin-top: ${top}px; }
    </style><script>
      document.fonts.load("16px Same").then(() =>
        document.body.insertAdjacentHTML("beforeend", "<h1>Title</h1><p>${TEXT}</p><p>After</p>"));
    </script>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
  const out = path.join(tmpdir(), `siyahi-cls-${process.pid}-${fallback}-${top}`);
  const child = spawn(process.execPath, [
    cls,
    `http://127.0.0.1:${port}/`,
    "--hold-fonts",
    "--network",
    "none",
    "--out",
    out,
    "--font",
    "Late",
  ]);
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const status = await new Promise((resolve) => child.on("close", resolve));
  server.close();
  return { status, output };
}

describe("siyahi-cls", { timeout: 120_000 }, () => {
  it("fails a page whose fallback font rewraps the text when the web font arrives", async () => {
    const run = await measure("monospace");
    expect(run.status, run.output).toBe(1);
    expect(run.output).toMatch(/font-at-first-paint=not yet moved=[1-9]/);
  });

  it("reports but passes text that rewraps below the first screen", async () => {
    const run = await measure("monospace", 2000);
    expect(run.status, run.output).toBe(0);
    expect(run.output).toMatch(/moved=[1-9]\d*\/\d+ in-view=0 /);
  });

  it("passes a page whose fallback has the web font's metrics", async () => {
    const run = await measure("Same");
    expect(run.status, run.output).toBe(0);
    expect(run.output).toMatch(/cls=0\.0000 .* font-at-first-paint=not yet moved=0\//);
  });
});
