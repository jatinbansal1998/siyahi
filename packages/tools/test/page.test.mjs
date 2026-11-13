import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { buildPage } from "../page.mjs";

// Needs @siyahi/ui built: the page imports the package as a consumer would.
const project = fileURLToPath(new URL("..", import.meta.url));

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
