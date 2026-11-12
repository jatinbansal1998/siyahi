#!/usr/bin/env node
// @ts-check
// Builds one React page on Siyahi into a single self-contained HTML file: its
// scripts, styles and fonts are inline, so the file opens or is hosted
// anywhere with nothing beside it.
//
//   siyahi-page <page.tsx> [--out <page>.html] [--title <title>]
//
// The page module's default export renders inside SiyahiProvider with
// Siyahi's stylesheet, in the page frame the catalogue uses: one <main> with
// the house gutter, stacking the page's blocks 24px apart. Tailwind reads
// class names from the page's folder.
// The page may live anywhere, a scratch folder included: its packages
// (@siyahi/ui, React, charts) resolve from the project siyahi-page runs in,
// which has them installed. The project's own vite.config is not used.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/** @typedef {{ html: string, sources: string[] }} BuiltPage */

// A page's own files are found from their text, before TypeScript erases a type-only import. In a script:
// `from "./x"`, `import "./x"`, `import("./x")` and `new URL("./x", import.meta.url)`. In a stylesheet:
// `@import "x"` and `url(x)`, where a path without "./" is relative too.
const SCRIPT = /\.[cm]?[jt]sx?$/;
const SCRIPT_REFERENCE = /(?:\bfrom|\bimport|\bnew URL)\s*\(?\s*(["'])(\.{1,2}\/[^"']+)\1/g;
const STYLE = /\.css$/;
const STYLE_REFERENCE = /(?:@import\s+(?:url\(\s*)?|url\(\s*)(["']?)([^"')\s;]+)\1/g;

// The catalogue's <main> (apps/catalogue/src/shell.tsx), centred.
const FRAME = "mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-8 md:px-8";

/** @param {string} text */
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Builds the page at `page` with the packages installed in `project`.
 * `sources` lists the page's own files that went into the build (the page and
 * the local modules it imports), so a caller can keep them next to the HTML.
 * @param {{ page: string, title: string, project: string }} options
 * @returns {Promise<BuiltPage>}
 */
export async function buildPage({ page, title, project }) {
  const pagePath = path.resolve(page);
  if (!existsSync(pagePath)) throw new Error(`No page at ${pagePath}`);
  const modules = path.join(path.resolve(project), "node_modules");
  if (!existsSync(path.join(modules, "@siyahi", "ui")))
    throw new Error(`@siyahi/ui is not installed in ${project}; run siyahi-page in a project that has it`);
  // Inside node_modules so bare imports from the entry resolve to the project's packages.
  mkdirSync(modules, { recursive: true });
  const root = mkdtempSync(path.join(modules, ".siyahi-page-"));
  const entry = path.join(root, "main.js");
  // Vite and the React plugin read NODE_ENV from the environment when it is
  // set; a test runner's or a dev shell's would build a development page.
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    writeFileSync(
      path.join(root, "index.html"),
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`,
    );
    writeFileSync(
      path.join(root, "page.css"),
      `@import "@siyahi/ui/styles.css";\n@source ${JSON.stringify(path.dirname(pagePath))};\n@source inline(${JSON.stringify(FRAME)});\n`,
    );
    writeFileSync(
      entry,
      `import "./page.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { SiyahiProvider } from "@siyahi/ui";
import Page from ${JSON.stringify(pagePath)};
createRoot(document.getElementById("root")).render(
  createElement(SiyahiProvider, null, createElement("main", { className: ${JSON.stringify(FRAME)} }, createElement(Page))),
);
`,
    );

    // The page's own files: the page and every file it reaches through relative
    // imports, read from the source text before TypeScript erases a type-only
    // import, so a pulled page is complete.
    const sources = new Set([realpathSync(pagePath)]);
    const pageDir = path.dirname(realpathSync(pagePath));
    const output = await build({
      configFile: false,
      root,
      logLevel: "warn",
      plugins: [
        react(),
        tailwindcss(),
        viteSingleFile(),
        {
          name: "siyahi-page:resolve",
          enforce: "pre",
          async buildStart() {
            for (const file of sources) {
              if (SCRIPT.test(file)) {
                for (const [, , specifier = ""] of readFileSync(file, "utf8").matchAll(SCRIPT_REFERENCE)) {
                  const resolved = await this.resolve(specifier, file, { skipSelf: true });
                  if (resolved && !resolved.external) sources.add(resolved.id.replace(/\?.*$/, ""));
                }
              } else if (STYLE.test(file)) {
                for (const [, , specifier = ""] of readFileSync(file, "utf8").matchAll(STYLE_REFERENCE)) {
                  // A scheme, an absolute path or a fragment is not the page's file; a bare name is, when it sits
                  // beside the stylesheet (`@import "tailwindcss"` names a package and does not).
                  if (/^[a-z][a-z0-9+.-]*:|^[/#]/i.test(specifier)) continue;
                  const target = path.resolve(path.dirname(file), specifier.replace(/[?#].*$/, ""));
                  if (existsSync(target)) sources.add(realpathSync(target));
                }
              }
            }
          },
          async resolveId(source, importer) {
            if (!importer || !sources.has(importer) || /^[./\0]|^[a-z]+:/i.test(source)) return null;
            // A page outside the project would otherwise look for its packages
            // beside itself; resolving them as if the entry imported them also
            // keeps one copy of React.
            return this.resolve(source, entry, { skipSelf: true });
          },
          // Anything else the build read from the page's folder, which the text did not name.
          generateBundle() {
            for (const id of this.getModuleIds()) {
              const file = id.replace(/\?.*$/, "");
              if (file.startsWith(pageDir + path.sep) && existsSync(file)) sources.add(file);
            }
          },
        },
      ],
      build: { write: false, emptyOutDir: false },
    });
    const outputs = Array.isArray(output) ? output : [output];
    const html = outputs
      .flatMap((result) => ("output" in result ? result.output : []))
      .find((file) => file.fileName === "index.html");
    if (html?.type !== "asset") throw new Error("The build wrote no index.html");
    return { html: String(html.source), sources: [...sources].toSorted() };
  } finally {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string" }, title: { type: "string" } },
  });
  const [page, ...rest] = positionals;
  if (!page || rest.length > 0) {
    console.error("usage: siyahi-page <page.tsx> [--out <page>.html] [--title <title>]");
    process.exit(2);
  }
  const name = path.basename(page).replace(/\.[jt]sx?$/, "");
  const out = path.resolve(values.out ?? `${name}.html`);
  const { html } = await buildPage({
    page,
    // 2026-11-12-gold-flows reads as "gold flows".
    title: values.title ?? name.replace(/^\d{4}-\d{2}-\d{2}-?/, "").replace(/-/g, " "),
    project: process.cwd(),
  });
  writeFileSync(out, html);
  console.log(`${out} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
}
