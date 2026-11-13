import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { buildPage } from "../page.mjs";

// Needs @siyahi/ui built: the page imports the package as a consumer would.
const project = fileURLToPath(new URL("..", import.meta.url));

/**
 * Writes a page folder at <dir>/page with the given files and builds the page. `files` may name two files outside
 * it: OUTSIDE_JSON, a package.json in a sibling folder (not above the page, where lookups are allowed), and
 * OUTSIDE, <dir>/outside.txt.
 * @param {Record<string, string>} files
 */
async function buildFolder(files) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-case-")));
  try {
    mkdirSync(path.join(dir, "page"));
    const outside = path.join(dir, "outside.txt");
    writeFileSync(outside, "outside\n");
    mkdirSync(path.join(dir, "elsewhere"));
    const outsideJson = path.join(dir, "elsewhere", "package.json");
    writeFileSync(outsideJson, "{}\n");
    for (const [name, text] of Object.entries(files))
      writeFileSync(
        path.join(dir, "page", name),
        text.replaceAll("OUTSIDE_JSON", outsideJson).replaceAll("OUTSIDE", outside),
      );
    return await buildPage({ page: path.join(dir, "page", "case.tsx"), title: "Case", project });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

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

  it("fails a page that reads a file outside its folder, so its folder is the whole of its source", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-outside-")));
    try {
      mkdirSync(path.join(dir, "page"));
      writeFileSync(path.join(dir, "outside.css"), `.outside { color: inherit; }\n`);
      // An absolute path, which a copy of the folder would still reach.
      writeFileSync(path.join(dir, "page", "page.css"), `@import ${JSON.stringify(path.join(dir, "outside.css"))};\n`);
      const page = path.join(dir, "page", "outside.tsx");
      writeFileSync(page, `import "./page.css";\nexport default function Outside() { return <h1>Outside</h1>; }\n`);
      await expect(buildPage({ page, title: "Outside", project })).rejects.toThrow(/outside\.css, outside its folder/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("fails a page that builds to more than one file, such as one with a Web Worker", async () => {
    await expect(
      buildFolder({
        "work.js": "self.postMessage(1);\n",
        "case.tsx": `const work = new Worker(new URL("./work.js", import.meta.url), { type: "module" });
export default function Case() { return <h1>{String(Boolean(work))}</h1>; }
`,
      }),
    ).rejects.toThrow(/more than one file/);
  }, 60_000);

  it("reads a package.json outside the page's folder as content, not as a type lookup", async () => {
    await expect(
      buildFolder({
        "case.tsx": `export const data = new URL("OUTSIDE_JSON", import.meta.url).href;
export default function Case() { return <h1>Case</h1>; }
`,
      }),
    ).rejects.toThrow(/package\.json, outside its folder/);
  }, 60_000);

  it("fails a page whose Tailwind plugin reads an outside file by a byte path", async () => {
    await expect(
      buildFolder({
        "plugin.mjs": `import { readFileSync } from "node:fs";
readFileSync(Buffer.from("OUTSIDE"));
export default function () {}
`,
        "case.css": `@plugin "./plugin.mjs";\n`,
        "case.tsx": `import "./case.css";\nexport default function Case() { return <h1>Case</h1>; }\n`,
      }),
    ).rejects.toThrow(/outside\.txt, outside its folder/);
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
});
