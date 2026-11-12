import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { buildPage } from "../page.mjs";

// Needs @siyahi/ui built: the page imports the package as a consumer would.
const project = fileURLToPath(new URL("..", import.meta.url));

describe("siyahi-page", () => {
  it("builds a page outside the project into one file and lists the page's own sources", async () => {
    // A scratch folder with no node_modules, as an agent writes a page.
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "siyahi-page-")));
    try {
      const page = path.join(dir, "2026-11-12-flows.tsx");
      const data = path.join(dir, "flows.data.ts");
      const types = path.join(dir, "flows.types.ts");
      writeFileSync(types, `export interface Row { label: string }\n`);
      writeFileSync(
        data,
        `import type { Row } from "./flows.types";\nexport const rows: Row[] = [];\nexport const marker: string = "flows-marker-" + 42;\n`,
      );
      // Files reached only through a stylesheet or new URL(), which the build inlines.
      const css = path.join(dir, "flows.css");
      const extra = path.join(dir, "extra style.css");
      const dot = path.join(dir, "dot image.svg");
      const logo = path.join(dir, "logo.svg");
      // CSS reads a path without "./" as relative too, and a quoted one may hold spaces; "tailwindcss" is a
      // package, not a file beside it.
      const more = path.join(dir, "more.css");
      writeFileSync(css, `@import "tailwindcss";\n@import "extra style.css";\n@import "./more.css";\n`);
      writeFileSync(extra, `.flows-dot { background: url("dot image.svg"); }\n`);
      writeFileSync(more, `.flows-more { color: inherit; }\n`);
      writeFileSync(dot, `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`);
      writeFileSync(logo, `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>`);
      writeFileSync(
        page,
        `import { PageHeader } from "@siyahi/ui";
import "./flows.css";
import { marker } from "./flows.data";
export const logo = new URL("./logo.svg", import.meta.url).href;
export default function Flows() {
  return <div className="tracking-widest"><PageHeader title={marker} /></div>;
}
`,
      );

      const { html, sources } = await buildPage({ page, title: "Flows <today>", project });

      expect(html).toContain("<title>Flows &lt;today&gt;</title>");
      expect(html).toContain("flows-marker-");
      // Scripts, styles and fonts are inline: nothing for the browser to fetch.
      expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+rel="?(stylesheet|modulepreload)/);
      expect(html).toContain("font/woff2;base64");
      // A production build, though the test runner sets NODE_ENV=test.
      expect(html).not.toContain("jsxDEV");
      // Tailwind read the page's folder.
      expect(html).toContain(".tracking-widest");
      // The type-only import, which TypeScript erases before the build sees it, is listed too.
      expect(sources).toEqual([page, data, types, css, extra, more, dot, logo].toSorted());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
