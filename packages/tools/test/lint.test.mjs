import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { recommended } from "../lint/index.mjs";

const tools = fileURLToPath(new URL("..", import.meta.url));
const oxlint = path.join(tools, "node_modules/.bin/oxlint");

/**
 * Lints one file with only the siyahi rules and returns the rule names that fired.
 * @param {string} source
 * @param {object} [settings] oxlint settings, such as shadcn's, which tell it where components come from
 * @param {Record<string, string>} [rules] the rules to run, the page rules unless given
 * @param {string[]} [flags] more oxlint flags, such as --fix, which rewrites the file in `dir`
 * @param {string} [dir]
 * @returns {string[]}
 */
function lint(
  source,
  settings = {},
  rules = recommended,
  flags = [],
  dir = mkdtempSync(path.join(tmpdir(), "siyahi-lint-")),
) {
  writeFileSync(path.join(dir, "page.tsx"), source);
  writeFileSync(
    path.join(dir, "oxlintrc.json"),
    JSON.stringify({ jsPlugins: [path.join(tools, "lint/index.mjs")], settings, rules }),
  );
  let output = "";
  try {
    output = execFileSync(oxlint, ["-c", "oxlintrc.json", "--format", "json", ...flags, "page.tsx"], {
      cwd: dir,
      encoding: "utf8",
    });
  } catch (error) {
    output = /** @type {{ stdout: string }} */ (error).stdout;
  }
  /** @type {{ diagnostics: { code: string }[] }} */
  const report = JSON.parse(output);
  return report.diagnostics
    .filter((d) => d.code.startsWith("siyahi("))
    .map((d) => d.code.replace(/^siyahi\((.*)\)$/, "$1"))
    .toSorted();
}

const IMPORT = `import { Card } from "@siyahi/ui";\n`;

describe("siyahi lint rules", () => {
  it("reports a hex colour", () => {
    expect(lint(`${IMPORT}export const c = "#1a2b3c";`)).toEqual(["no-color-literal"]);
  });

  it("reports rgb() and oklch() colours", () => {
    expect(lint(`${IMPORT}export const a = "rgb(0 0 0)";\nexport const b = \`oklch(0.5 0.1 \${1})\`;`)).toEqual([
      "no-color-literal",
      "no-color-literal",
    ]);
  });

  it("reports a dark: variant", () => {
    expect(lint(`${IMPORT}export const A = () => <Card className="p-4 dark:bg-muted" />;`)).toEqual([
      "no-scheme-variant",
    ]);
  });

  it("reports a light: variant stacked after another variant", () => {
    expect(lint(`${IMPORT}export const A = () => <Card className="p-4 md:light:p-2" />;`)).toEqual([
      "no-scheme-variant",
    ]);
  });

  it("reports a numeric font size in a style object and as a prop", () => {
    expect(
      lint(`${IMPORT}export const A = () => <><Card style={{ fontSize: 13 }} /><text fontSize="12px" /></>;`),
    ).toEqual(["no-numeric-font-size", "no-numeric-font-size"]);
  });

  it("reports Tailwind arbitrary values for size and colour", () => {
    expect(lint(`${IMPORT}export const A = () => <Card className="w-[37px] bg-[#fff]" />;`)).toContain(
      "no-arbitrary-values",
    );
  });

  it("reports a chart config with a per-scheme theme map", () => {
    expect(
      lint(
        `${IMPORT}export const config = { value: { label: "Value", theme: { light: "var(--chart-1)", dark: "var(--chart-2)" } } };`,
      ),
    ).toEqual(["no-chart-theme-map"]);
  });

  it("accepts a chart config colour that names a chart token", () => {
    expect(lint(`${IMPORT}export const config = { value: { label: "Value", color: "var(--chart-1)" } };`)).toEqual([]);
  });

  it("accepts theme tokens, var() and the type scale", () => {
    expect(
      lint(
        `${IMPORT}export const A = () => <Card className="bg-card text-sm text-positive" style={{ color: "var(--chart-1)" }} />;`,
      ),
    ).toEqual([]);
  });

  it("reports a component restyled with spacing, colour or shape, and lets layout through", () => {
    const shadcn = { shadcn: { ui: "@siyahi/ui" } };
    expect(lint(`${IMPORT}export const A = () => <Card className="p-4 bg-muted rounded-none" />;`, shadcn)).toEqual([
      "no-restyle",
      "no-restyle",
      "no-restyle",
    ]);
    expect(lint(`${IMPORT}export const A = () => <Card className="mt-4 w-full md:col-span-2" />;`, shadcn)).toEqual([]);
  });

  it("leaves files that do not import @siyahi/ui alone", () => {
    expect(
      lint(`export const c = "#1a2b3c";\nexport const A = () => <div className="dark:bg-black text-[13px]" />;`),
    ).toEqual([]);
  });
});

describe("siyahi library rules", () => {
  const LIBRARY = { "siyahi/optional-accepts-undefined": "error" };

  it("reports an optional property that rejects undefined, in any file", () => {
    expect(lint(`export interface Item { tone?: "negative" | "warning"; label: string }`, {}, LIBRARY)).toEqual([
      "optional-accepts-undefined",
    ]);
  });

  it("accepts an optional property that takes undefined, ReactNode, unknown or a required one", () => {
    const source = [
      `import type * as React from "react";`,
      `export interface Item {`,
      `  tone?: "negative" | "warning" | undefined;`,
      `  note?: React.ReactNode;`,
      `  meta?: unknown;`,
      `  label: string;`,
      `}`,
    ].join("\n");
    expect(lint(source, {}, LIBRARY)).toEqual([]);
  });

  it("is not among the page rules", () => {
    expect(lint(`import { Card } from "@siyahi/ui";\nexport interface Item { tone?: "negative" }`)).toEqual([]);
  });

  it("reports an optional method, class field and mapped property, and leaves a conditional type's pattern alone", () => {
    const source = [
      `export interface Props { onSelect?(): void }`,
      `export class Settings { tone?: string }`,
      `export type Loose<T> = { [K in keyof T]?: T[K] };`,
      `export type Picked<T> = T extends { x?: infer U extends string } ? U : never;`,
    ].join("\n");
    expect(lint(source, {}, LIBRARY)).toEqual([
      "optional-accepts-undefined",
      "optional-accepts-undefined",
      "optional-accepts-undefined",
    ]);
  });

  it("fixes by adding `| undefined`, bracketing a function type, and is clean after", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "siyahi-lint-"));
    const source = `export type Props = { tone?: "negative"; onSelect?: (label: string) => void }\nexport type Loose<T> = { [K in keyof T]?: T[K] }`;
    lint(source, {}, LIBRARY, ["--fix"], dir);
    const fixed = readFileSync(path.join(dir, "page.tsx"), "utf8");
    expect(fixed).toBe(
      `export type Props = { tone?: "negative" | undefined; onSelect?: ((label: string) => void) | undefined }\nexport type Loose<T> = { [K in keyof T]?: T[K] | undefined }`,
    );
    expect(lint(fixed, {}, LIBRARY)).toEqual([]);
  });
});
