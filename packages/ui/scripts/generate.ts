// Writes every generated file in @siyahi/ui. With --check, writes nothing and
// fails when a committed file differs from what this script would write.
//
//   styles/shadcn.css     shadcn's tailwind.css, so the shadcn CLI is not a
//                         runtime dependency
//   report.css            the theme as plain CSS for static HTML reports
//   registry.lock.json    origin, licence and hash of each registry add-on,
//                         read from the header every copied file carries
//   src/index.ts          the barrel behind `import { … } from "@siyahi/ui"`
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
    const kept = names.filter(({ name }) => !taken.has(name));
    for (const { name } of names) taken.add(name);
    if (!clash) return `export * from "${specifier}"`;
    const values = kept.filter((e) => !e.isType).map((e) => e.name);
    const types = kept.filter((e) => e.isType).map((e) => e.name);
    return [
      values.length ? `export { ${values.join(", ")} } from "${specifier}"` : "",
      types.length ? `export type { ${types.join(", ")} } from "${specifier}"` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `// Generated by scripts/generate.ts from the component folders. Do not edit.\n${lines.join("\n")}\n`;
}

const outputs: Record<string, () => string> = {
  "styles/shadcn.css": shadcnCss,
  "report.css": reportCss,
  "registry.lock.json": registryLock,
  "src/index.ts": barrel,
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
