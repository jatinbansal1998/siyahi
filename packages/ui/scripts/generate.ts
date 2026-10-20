// Writes every generated file in @siyahi/ui. With --check, writes nothing and
// fails when a committed file differs from what this script would write.
//
//   styles/shadcn.css     shadcn's tailwind.css, so the shadcn CLI is not a
//                         runtime dependency
//   report.css            the theme as plain CSS for static HTML reports
//   registry.lock.json    origin, licence and hash of each registry add-on,
//                         read from the header every copied file carries
//   src/index.ts          the barrel behind `import { … } from "@siyahi/ui"`
//   README.md, LICENSE, THIRD_PARTY_NOTICES.md
//                         copies of the root files, here and in
//                         packages/tools, so every tarball carries them
//                         (MIT needs the notices to travel with the code)
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { readTheme, type Variables } from "@siyahi/tools/theme";

const root = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(root, "../..");
const read = (file: string): string => readFileSync(path.join(root, file), "utf8");
const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

function shadcnCss(): string {
  const source = readFileSync(path.join(root, "node_modules/shadcn/dist/tailwind.css"), "utf8");
  const { version } = JSON.parse(readFileSync(path.join(root, "node_modules/shadcn/package.json"), "utf8")) as {
    version: string;
  };
  return `/*
 * Copied from shadcn@${version}/dist/tailwind.css by scripts/generate.ts. Do not edit.
 * Origin: https://github.com/shadcn-ui/ui/tree/main/packages/shadcn
 * Licence: MIT, Copyright (c) 2023 shadcn
 * sha256: ${sha256(source)}
 */
${source}`;
}

const SANS = `"Geist", "Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const MONO = `"Geist Mono", "Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace`;

const block = (vars: Variables, indent: string): string =>
  Object.entries(vars)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join("\n");

function reportCss(): string {
  const { light, dark } = readTheme(read("styles/siyahi.css"));
  const darkOnly = Object.fromEntries(Object.entries(dark).filter(([name, value]) => light[name] !== value));
  return `/*
 * Siyahi report stylesheet, generated from @siyahi/ui styles/siyahi.css.
 * Inline it into a report's <style>. It makes no network requests: Geist is
 * used when the viewer has it installed, and the system font otherwise.
 */
:root {
  color-scheme: light dark;
${block(light, "  ")}
}

@media (prefers-color-scheme: dark) {
  :root {
${block(darkOnly, "    ")}
  }
}

*,
::before,
::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 16px;
  background: var(--background);
  color: var(--foreground);
  font-family: ${SANS};
  font-size: 14px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

code,
kbd,
pre,
samp {
  font-family: ${MONO};
}

a {
  color: var(--link);
}

@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
}

// Font metrics in font units, as @capsizecss/metrics 4.4.0 reads them from the
// font files. xWidthAvg is capsize's average advance of English text: the
// Latin letters and the space, weighted by how often each occurs. Geist's 400
// numbers are those of the woff2 fontsource ships; the other weights are
// Google Fonts' static instances of the same variable font.
interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  xWidthAvg: number;
}

const geistAt = (xWidthAvg: number): FontMetrics => ({
  unitsPerEm: 1000,
  ascent: 1005,
  descent: -295,
  lineGap: 0,
  xWidthAvg,
});
const ARIAL = { unitsPerEm: 2048, ascent: 1854, descent: -434, lineGap: 67, xWidthAvg: 913 };
const ARIAL_BOLD = { ...ARIAL, xWidthAvg: 983 };
const COURIER_NEW = { unitsPerEm: 2048, ascent: 1705, descent: -615, lineGap: 0, xWidthAvg: 1229 };

// capsize's average sums advances, but Geist kerns: English text set in Geist
// is 1.8% narrower than the sum, net of Arial's own kerning (1.7 to 2.0% across
// five documents at 400 and 600, measured in Chromium against Liberation Sans).
// Geist Mono does not kern.
const GEIST_KERNING = 0.982;

// Liberation and Arimo (Linux, ChromeOS) are drawn to Arial's metrics, and
// Liberation Mono and Cousine to Courier New's, so one face serves each set.
// Each name is listed as its full name and its PostScript name, the two names
// local() matches.
const ARIAL_REGULAR = ["Arial", "ArialMT", "Liberation Sans", "LiberationSans", "Arimo", "Arimo-Regular"];
const ARIAL_BOLD_FILES = [
  "Arial Bold",
  "Arial-BoldMT",
  "Liberation Sans Bold",
  "LiberationSans-Bold",
  "Arimo Bold",
  "Arimo-Bold",
];
const COURIER_REGULAR = [
  "Courier New",
  "CourierNewPSMT",
  "Liberation Mono",
  "LiberationMono",
  "Cousine",
  "Cousine-Regular",
];
const COURIER_BOLD = [
  "Courier New Bold",
  "CourierNewPS-BoldMT",
  "Liberation Mono Bold",
  "LiberationMono-Bold",
  "Cousine Bold",
  "Cousine-Bold",
];

interface FallbackFace {
  family: string;
  weights: string;
  font: FontMetrics;
  kerning: number;
  fallback: FontMetrics;
  locals: string[];
}

// One face per band of weights, scaled to Geist's width at that weight. Bold
// bands draw the fallback's bold file: a synthetic bold keeps the regular
// advances, so bold text would come up short. Geist Mono is 600 units wide at
// every weight, and Courier New 1229 of 2048, so its bands differ only in file.
const sans = (weights: string, xWidthAvg: number, fallback: FontMetrics, locals: string[]): FallbackFace => ({
  family: "Geist Fallback",
  weights,
  font: geistAt(xWidthAvg),
  kerning: GEIST_KERNING,
  fallback,
  locals,
});
const mono = (weights: string, locals: string[]): FallbackFace => ({
  family: "Geist Mono Fallback",
  weights,
  font: geistAt(600),
  kerning: 1,
  fallback: COURIER_NEW,
  locals,
});
const FALLBACK_FACES: FallbackFace[] = [
  sans("100 450", 467, ARIAL, ARIAL_REGULAR),
  sans("451 550", 478, ARIAL, ARIAL_REGULAR),
  sans("551 650", 489, ARIAL_BOLD, ARIAL_BOLD_FILES),
  sans("651 900", 499, ARIAL_BOLD, ARIAL_BOLD_FILES),
  mono("100 550", COURIER_REGULAR),
  mono("551 900", COURIER_BOLD),
];

const percent = (ratio: number): string => `${Number((ratio * 100).toFixed(2))}%`;

// The capsize and fontaine sums: scale the fallback until its average width
// is Geist's, then set its ascent, descent and line gap to Geist's at that size.
function fallbackFace({ family, weights, font, kerning, fallback, locals }: FallbackFace): string {
  const sizeAdjust = ((font.xWidthAvg / font.unitsPerEm) * kerning) / (fallback.xWidthAvg / fallback.unitsPerEm);
  const em = font.unitsPerEm * sizeAdjust;
  return `@font-face {
  font-family: "${family}";
  src: ${locals.map((name) => `local("${name}")`).join(", ")};
  font-weight: ${weights};
  size-adjust: ${percent(sizeAdjust)};
  ascent-override: ${percent(font.ascent / em)};
  descent-override: ${percent(-font.descent / em)};
  line-gap-override: ${percent(font.lineGap / em)};
}`;
}

function fallbackFontsCss(): string {
  return `/*
 * Generated by scripts/generate.ts. Do not edit.
 * System fonts scaled to Geist's and Geist Mono's metrics. The theme names
 * them right after Geist, so the text a browser draws while Geist loads takes
 * the space Geist will, and nothing moves when Geist swaps in.
 */
${FALLBACK_FACES.map(fallbackFace).join("\n\n")}
`;
}

const filesUnder = (dir: string): string[] =>
  readdirSync(path.join(root, dir), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
    .toSorted();

interface LockEntry {
  file: string;
  registry: string;
  origin: string;
  licence: string;
  copied: string;
  sha256: string;
}

const HEADER =
  /^\/\/ Registry: (?<registry>\S+)\n\/\/ Origin: (?<origin>\S+)\n\/\/ Licence: (?<licence>.+)\n\/\/ Copied: (?<copied>\d{4}-\d{2}-\d{2}), sha256 (?<sha256>[0-9a-f]{64})\n/;

function registryLock(): string {
  const notices = readFileSync(path.join(repo, "THIRD_PARTY_NOTICES.md"), "utf8");
  const items: LockEntry[] = filesUnder("src/components/registry").map((file) => {
    const groups = HEADER.exec(read(file))?.groups;
    if (!groups) throw new Error(`${file}: no registry header (Registry, Origin, Licence, Copied lines)`);
    const entry: LockEntry = {
      file,
      registry: groups.registry ?? "",
      origin: groups.origin ?? "",
      licence: groups.licence ?? "",
      copied: groups.copied ?? "",
      sha256: groups.sha256 ?? "",
    };
    if (!notices.includes(entry.origin)) throw new Error(`${file}: ${entry.origin} is not in THIRD_PARTY_NOTICES.md`);
    const body = read(file).slice(HEADER.exec(read(file))?.[0].length ?? 0);
    if (sha256(body) !== entry.sha256 && !body.includes("// Siyahi edit:")) {
      throw new Error(`${file}: differs from the copy its header hashes but has no // Siyahi edit: line`);
    }
    return entry;
  });
  return `${JSON.stringify({ generatedBy: "packages/ui/scripts/generate.ts", items }, null, 2)}\n`;
}

// Add-ons keep their internals (helpers, hooks, their own table primitive)
// out of the barrel; only their components and types are public.
const INTERNAL = /\/(lib|hooks|config|ui)\//;

interface Exported {
  name: string;
  isType: boolean;
}

// Reads a module's export names. Good enough for the shapes shadcn and the
// add-ons use; tsc reports any clash this misses.
function exportsOf(file: string): Exported[] {
  const source = read(file);
  const found: Exported[] = [];
  for (const m of source.matchAll(
    /^export (?:declare )?(?:async )?(function|const|let|class|interface|type|enum) (\w+)/gm,
  )) {
    found.push({ name: m[2] ?? "", isType: m[1] === "interface" || m[1] === "type" });
  }
  for (const m of source.matchAll(/^export (type )?\{([^}]*)\}(?! from)/gm)) {
    for (const part of (m[2] ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)) {
      const isType = Boolean(m[1]) || part.startsWith("type ");
      found.push({
        name:
          part
            .replace(/^type /, "")
            .split(/\s+as\s+/)
            .at(-1) ?? "",
        isType,
      });
    }
  }
  return found;
}

// Names an add-on exports that an earlier module already exports, and what
// the barrel calls them instead. A new clash without an entry fails the
// generator, so no export is ever dropped silently.
const RENAMES: Record<string, Record<string, string>> = {
  "src/components/registry/heatmap/weekday-heatmap.tsx": { ColorConfig: "WeekdayColorConfig" },
  "src/components/registry/niko-table/types/index.ts": { DataTableHeader: "DataTableHeaderCell" },
};

// `export *` from two modules that share a name exports neither, so a module
// with a name an earlier module already took gets an explicit list instead.
function barrel(): string {
  const modules = [
    ...filesUnder("src/components/ui"),
    ...filesUnder("src/components/registry").filter(
      (file) => !INTERNAL.test(file.replace("src/components/registry", "")),
    ),
    ...filesUnder("src/components/siyahi"),
    "src/lib/format.ts",
    "src/lib/locale.ts",
    "src/lib/recharts.ts",
  ];
  const taken = new Set<string>();
  const lines = modules.map((file) => {
    const specifier = `./${file.replace(/^src\//, "").replace(/\.tsx?$/, "")}`;
    const names = exportsOf(file);
    const clash = names.some(({ name }) => taken.has(name));
    const renames = RENAMES[file] ?? {};
    const exported = names.map(({ name, isType }) => {
      if (!taken.has(name)) return { name, isType, as: name };
      const as = renames[name];
      if (!as) throw new Error(`${file} exports ${name}, which an earlier module exports too; add it to RENAMES`);
      return { name, isType, as };
    });
    for (const { as } of exported) taken.add(as);
    if (!clash) return `export * from "${specifier}"`;
    const listed = (list: typeof exported) => list.map((e) => (e.as === e.name ? e.name : `${e.name} as ${e.as}`));
    const values = listed(exported.filter((e) => !e.isType));
    const types = listed(exported.filter((e) => e.isType));
    return [
      values.length ? `export { ${values.join(", ")} } from "${specifier}"` : "",
      types.length ? `export type { ${types.join(", ")} } from "${specifier}"` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `// Generated by scripts/generate.ts from the component folders. Do not edit.\n${lines.join("\n")}\n`;
}

const fromRepo = (file: string) => () => readFileSync(path.join(repo, file), "utf8");

const outputs: Record<string, () => string> = {
  "styles/shadcn.css": shadcnCss,
  "styles/fallback-fonts.css": fallbackFontsCss,
  "report.css": reportCss,
  "registry.lock.json": registryLock,
  "src/index.ts": barrel,
  "README.md": fromRepo("README.md"),
  LICENSE: fromRepo("LICENSE"),
  "THIRD_PARTY_NOTICES.md": fromRepo("THIRD_PARTY_NOTICES.md"),
  "../tools/LICENSE": fromRepo("LICENSE"),
  "../tools/THIRD_PARTY_NOTICES.md": fromRepo("THIRD_PARTY_NOTICES.md"),
};

const check = process.argv.includes("--check");
const changed: string[] = [];
for (const [file, render] of Object.entries(outputs)) {
  const next = render();
  let current: string | null = null;
  try {
    current = read(file);
  } catch {
    // Missing counts as stale.
  }
  if (current === next) continue;
  changed.push(file);
  if (!check) writeFileSync(path.join(root, file), next);
}
if (check && changed.length > 0) {
  console.error(`Stale generated files in packages/ui: ${changed.join(", ")}. Run \`pnpm generate\` and commit.`);
  process.exit(1);
}
console.log(changed.length ? `wrote ${changed.join(", ")}` : "generated files are current");
