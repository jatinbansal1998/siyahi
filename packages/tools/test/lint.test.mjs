import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
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
 * @returns {string[]}
 */
function lint(source) {
  const dir = mkdtempSync(path.join(tmpdir(), "siyahi-lint-"));
  writeFileSync(path.join(dir, "page.tsx"), source);
  writeFileSync(
    path.join(dir, "oxlintrc.json"),
    JSON.stringify({ jsPlugins: [path.join(tools, "lint/index.mjs")], rules: recommended }),
  );
  let output = "";
  try {
    output = execFileSync(oxlint, ["-c", "oxlintrc.json", "--format", "json", "page.tsx"], {
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

  it("leaves files that do not import @siyahi/ui alone", () => {
    expect(
      lint(`export const c = "#1a2b3c";\nexport const A = () => <div className="dark:bg-black text-[13px]" />;`),
    ).toEqual([]);
  });
});
