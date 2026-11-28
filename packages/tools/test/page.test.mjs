import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { describe, expect, it } from "vite-plus/test";
import { buildPage } from "../page.mjs";

// Needs @siyahi/ui built: the page imports the package as a consumer would.
const project = fileURLToPath(new URL("..", import.meta.url));

// The skeleton a Claude artifact's host wraps a published page in, read back from a published artifact. Its rules
// sit outside any cascade layer, so they outrank every layered rule in the page.
/** @param {string} html */
const claudeArtifact = (html) =>
  `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>${html}</body></html>`;

describe("siyahi-page", () => {
  it("builds a page outside the project into one file", async () => {
    // A scratch folder with no node_modules, as an agent writes a page.
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-")));
    try {
      const page = path.join(dir, "2026-11-12-flows.tsx");
      writeFileSync(path.join(dir, "flows.data.ts"), `export const marker: string = "flows-marker-" + 42;\n`);
      writeFileSync(
        page,
        `import { PageHeader } from "@siyahi/ui";
import { marker } from "./flows.data";
export default function Flows() {
  return <div className="tracking-widest"><PageHeader title={marker} /></div>;
}
`,
      );

      const html = await buildPage({ page, title: "Flows <today>", project });

      expect(html).toContain("<title>Flows &lt;today&gt;</title>");
      expect(html).toContain("flows-marker-");
      // Scripts, styles and fonts are inline: nothing for the browser to fetch.
      expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+rel="?(stylesheet|modulepreload)/);
      expect(html).toContain("font/woff2;base64");
      // A production build, though the test runner sets NODE_ENV=test.
      expect(html).not.toContain("jsxDEV");
      // Tailwind read the page's folder.
      expect(html).toContain(".tracking-widest");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("fails a page that builds to more than one file, such as one with a Web Worker", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-worker-")));
    try {
      writeFileSync(path.join(dir, "work.js"), "self.postMessage(1);\n");
      const page = path.join(dir, "worker.tsx");
      writeFileSync(
        page,
        `const work = new Worker(new URL("./work.js", import.meta.url), { type: "module" });
export default function WorkerPage() { return <h1>{String(Boolean(work))}</h1>; }
`,
      );
      await expect(buildPage({ page, title: "Worker", project })).rejects.toThrow(/more than one file/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("fails a page that refers to a file outside its folder by a relative path", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-parent-")));
    try {
      writeFileSync(path.join(dir, "image.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`);
      mkdirSync(path.join(dir, "page"));
      const page = path.join(dir, "page", "parent.tsx");
      // Built from a copy of the folder, as dash builds it, the image above it is not there.
      rmSync(path.join(dir, "image.svg"));
      writeFileSync(
        page,
        `const image = new URL("../image.svg", import.meta.url).href;
export default function Parent() { return <img src={image} alt="" />; }
`,
      );
      await expect(buildPage({ page, title: "Parent", project })).rejects.toThrow(/could not find/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("builds a page that refers to an external image and a fragment, which are no files to find", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-external-")));
    try {
      const page = path.join(dir, "external.tsx");
      writeFileSync(
        page,
        `const image = new URL("https://assets.example.test/image.svg", import.meta.url).href;
const mark = new URL("#identity", import.meta.url).href;
export default function External() { return <img src={image} alt={mark} />; }
`,
      );
      expect(await buildPage({ page, title: "External", project })).toContain("assets.example.test/image.svg");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("builds through a symlink, as npx runs the siyahi-page bin", () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-bin-")));
    try {
      const page = path.join(dir, "bin-page.tsx");
      writeFileSync(page, `export default function BinPage() { return <h1>Bin</h1>; }\n`);
      const bin = path.join(dir, "siyahi-page");
      symlinkSync(fileURLToPath(new URL("../page.mjs", import.meta.url)), bin);
      const out = path.join(dir, "bin-page.html");
      execFileSync(process.execPath, [bin, page, "--out", out], { cwd: project });
      expect(readFileSync(out, "utf8")).toContain("<title>bin page</title>");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("keeps its colours, font and scheme when a Claude artifact's host wraps it", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-host-")));
    const browser = await chromium.launch();
    try {
      const page = path.join(dir, "host.tsx");
      writeFileSync(page, `export default function Host() { return <h1>Host</h1>; }\n`);
      const html = await buildPage({ page, title: "Host", project });
      const bare = path.join(dir, "bare.html");
      const wrapped = path.join(dir, "wrapped.html");
      writeFileSync(bare, html);
      writeFileSync(wrapped, claudeArtifact(html));

      /**
       * The body's look and the root's scheme in `file`, on a device in `device` mode, with `theme` as the
       * data-theme a viewer's toggle sets on <html>, which wins over the device.
       * @param {string} file
       * @param {"light" | "dark"} device
       * @param {string | undefined} theme
       */
      const look = async (file, device, theme) => {
        const context = await browser.newContext({ colorScheme: device });
        const tab = await context.newPage();
        await tab.goto(pathToFileURL(file).href);
        await tab.locator("h1").waitFor();
        const values = await tab.evaluate((forced) => {
          if (forced) document.documentElement.dataset.theme = forced;
          const body = getComputedStyle(document.body);
          return {
            background: body.backgroundColor,
            color: body.color,
            font: body.fontFamily,
            // The host's font shorthand resets these too: the size, the line height and Siyahi's tabular figures.
            size: body.fontSize,
            lineHeight: body.lineHeight,
            figures: body.fontVariantNumeric,
            scheme: getComputedStyle(document.documentElement).colorScheme,
          };
        }, theme);
        await context.close();
        return values;
      };

      const states = /** @type {const} */ ([
        { device: "light", theme: undefined, scheme: "light" },
        { device: "dark", theme: undefined, scheme: "dark" },
        { device: "light", theme: "dark", scheme: "dark" },
        { device: "dark", theme: "light", scheme: "light" },
      ]);
      /** @type {object[]} */
      const expected = [];
      /** @type {object[]} */
      const received = [];
      for (const { device, theme, scheme } of states) {
        const own = await look(bare, device, theme);
        expect(own.scheme).toBe(scheme);
        expect(own.font).toMatch(/^"JetBrains Mono Variable"/);
        expect(own.figures).toBe("tabular-nums");
        expected.push({ device, theme, ...own });
        received.push({ device, theme, ...(await look(wrapped, device, theme)) });
      }
      expect(received).toEqual(expected);
    } finally {
      await browser.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
