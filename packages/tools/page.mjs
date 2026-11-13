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
import fs, { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { Buffer } from "node:buffer";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// The catalogue's <main> (apps/catalogue/src/shell.tsx), centred.
const FRAME = "mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-8 md:px-8";

/**
 * Where installed packages live: each entry of the project's node_modules by its real path, since a workspace links
 * a package from elsewhere in its repository.
 * @param {string} modules
 */
function packageRoots(modules) {
  return (
    readdirSync(modules)
      // Hidden entries (.bin, .pnpm, another build's .siyahi-page-*) are not packages, and one may vanish mid-listing.
      .filter((name) => !name.startsWith("."))
      .flatMap((name) =>
        name.startsWith("@") ? readdirSync(path.join(modules, name)).map((scoped) => path.join(name, scoped)) : [name],
      )
      .map((entry) => path.join(modules, entry))
      .filter((entry) => existsSync(entry))
      .map((entry) => realpathSync(entry))
  );
}

/**
 * Runs `work` and returns every file it opened through node:fs: Tailwind reads stylesheets and Vite reads url()
 * assets this way. Rolldown reads modules natively, so those come from the module graph instead.
 * @template T
 * @param {() => Promise<T>} work
 * @returns {Promise<{ result: T, reads: Set<string> }>}
 */
async function recordingReads(work) {
  /** @type {Set<string>} */
  const reads = new Set();
  /** @type {[Record<string, unknown>, string][]} */
  const targets = [
    [fs, "readFileSync"],
    [fs, "readFile"],
    [fs, "createReadStream"],
    [fs, "openSync"],
    [fs, "open"],
    [fs.promises, "readFile"],
    [fs.promises, "open"],
    [fs, "openAsBlob"],
  ];
  const originals = targets.map(([owner, name]) => /** @type {Function} */ (owner[name]));
  targets.forEach(([owner, name], i) => {
    const original = /** @type {Function} */ (originals[i]);
    owner[name] = function (/** @type {unknown} */ file, /** @type {unknown[]} */ ...rest) {
      if (typeof file === "string") reads.add(path.resolve(file));
      else if (file instanceof URL) reads.add(fileURLToPath(file));
      else if (file instanceof Uint8Array) reads.add(path.resolve(Buffer.from(file).toString()));
      return original.call(this, file, ...rest);
    };
  });
  // The named exports of node:fs that other modules imported follow the patched functions only after a sync.
  syncBuiltinESMExports();
  try {
    return { result: await work(), reads };
  } finally {
    targets.forEach(([owner, name], i) => (owner[name] = originals[i]));
    syncBuiltinESMExports();
  }
}

/** @param {string} text */
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Builds the page at `page` with the packages installed in `project`, and returns the page as one HTML file.
 * @param {{ page: string, title: string, project: string }} options
 * @returns {Promise<string>}
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

    const pageDir = path.dirname(realpathSync(pagePath));
    /** @type {Set<string>} */
    const modulesRead = new Set();
    const { result: output, reads } = await recordingReads(() =>
      build({
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
            async resolveId(source, importer) {
              if (!importer?.startsWith(pageDir + path.sep) || /^[./\0]|^[a-z]+:/i.test(source)) return null;
              // A page's folder may sit outside the project, where its packages
              // are not; resolving them as if the entry imported them also keeps
              // one copy of React.
              return this.resolve(source, entry, { skipSelf: true });
            },
            generateBundle() {
              for (const id of this.getModuleIds()) modulesRead.add(id.replace(/\?.*$/, ""));
            },
          },
        ],
        build: { write: false, emptyOutDir: false },
      }),
    );
    // A page reads only its folder and installed packages, so the folder is the whole of its source; a host that
    // keeps the folder can rebuild the page from it. Node and Vite read the package.json files in the folders above
    // the page and the entry to learn a module's type, which is not the page's content; a package.json anywhere else
    // is read as content. Not seen here, so not checked: what Tailwind's native scanner reads for an absolute
    // @source, and what a plugin reads from another thread.
    const allowed = [pageDir, root, ...packageRoots(modules)];
    /** @param {string} file */
    const isTypeLookup = (file) =>
      path.basename(file) === "package.json" &&
      [pageDir, root, realpathSync(root)].some((dir) => !path.relative(path.dirname(file), dir).startsWith(".."));
    const outsideReads = [...reads, ...modulesRead].filter(
      (file) =>
        path.isAbsolute(file) &&
        !isTypeLookup(file) &&
        !file.includes(`${path.sep}node_modules${path.sep}`) &&
        !allowed.some((dir) => file === dir || file.startsWith(dir + path.sep)),
    );
    // Name the file the page asked for, not the package.json Node looked up beside it.
    const outside = outsideReads.find((file) => path.basename(file) !== "package.json") ?? outsideReads[0];
    if (outside)
      throw new Error(
        `The page reads ${outside}, outside its folder and the installed packages; keep everything it uses in its folder`,
      );
    const outputs = Array.isArray(output) ? output : [output];
    const files = outputs.flatMap((result) => ("output" in result ? result.output : []));
    // The page is one file; anything else the build wrote (a Web Worker's script) would be missing where it is hosted.
    const extra = files.find((file) => file.fileName !== "index.html");
    if (extra)
      throw new Error(`The page built to more than one file (${extra.fileName}); a Web Worker is not supported`);
    const html = files.find((file) => file.fileName === "index.html");
    if (html?.type !== "asset") throw new Error("The build wrote no index.html");
    return String(html.source);
  } finally {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    rmSync(root, { recursive: true, force: true });
  }
}

// npx runs a bin through a symlink, so compare real paths, as contrast.mjs does.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
  const html = await buildPage({
    page,
    // 2026-11-12-gold-flows reads as "gold flows".
    title: values.title ?? name.replace(/^\d{4}-\d{2}-\d{2}-?/, "").replace(/-/g, " "),
    project: process.cwd(),
  });
  writeFileSync(out, html);
  console.log(`${out} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
}
