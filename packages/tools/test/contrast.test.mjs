import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { contrast, parseOklch, toHex } from "../color.mjs";
import { checkContrast, checkGamut } from "../contrast.mjs";
import { readTheme } from "../theme.mjs";

const themeCss = readFileSync(fileURLToPath(new URL("../../ui/styles/siyahi.css", import.meta.url)), "utf8");
const failures = (/** @type {string} */ css) => checkContrast(readTheme(css)).filter((c) => c.ratio < c.min);

/**
 * Replaces one variable's value inside the light block or the dark block.
 * @param {string} css @param {"light" | "dark"} scheme @param {string} name @param {string} value
 */
function setVar(css, scheme, name, value) {
  const darkStart = css.indexOf("@variant dark {");
  const [head, tail] = [css.slice(0, darkStart), css.slice(darkStart)];
  const pattern = new RegExp(`(--${name}:\\s*)[^;]+;`);
  return scheme === "light" ? head.replace(pattern, `$1${value};`) + tail : head + tail.replace(pattern, `$1${value};`);
}

describe("colour maths", () => {
  it("matches Tailwind's published hex for the neutral canvas values", () => {
    expect(toHex(/** @type {any} */ (parseOklch("oklch(0.145 0 0)")))).toBe("#0a0a0a");
    expect(toHex(/** @type {any} */ (parseOklch("oklch(0.577 0.245 27.325)")))).toBe("#e7000b");
  });

  it("gives 21:1 for black on white", () => {
    const black = /** @type {any} */ (parseOklch("oklch(0 0 0)"));
    const white = /** @type {any} */ (parseOklch("oklch(1 0 0)"));
    expect(contrast(black, white)).toBeCloseTo(21, 5);
  });
});

describe("contrast check", () => {
  it("passes the shipped theme", () => {
    expect(failures(themeCss)).toEqual([]);
  });

  it("fails text between 3:1 and 4.5:1 on the canvas and the card", () => {
    // About 3.7:1 on white: enough for a chart mark, not for text.
    const broken = setVar(themeCss, "light", "muted-foreground", "oklch(0.62 0 0)");
    expect(failures(broken).map((c) => `${c.scheme} ${c.fg}/${c.bg}`)).toEqual([
      "light muted-foreground/background",
      "light muted-foreground/card",
    ]);
  });

  it("fails a chart colour too close to its neighbour", () => {
    const broken = setVar(themeCss, "dark", "chart-2", "oklch(0.84 0.09 160)");
    expect(failures(broken).map((c) => `${c.scheme} ${c.fg}/${c.bg}`)).toEqual([
      "dark chart-1/chart-2",
      "dark chart-2/chart-3",
    ]);
  });

  it("fails a chart colour too faint against the card", () => {
    const broken = setVar(themeCss, "light", "chart-3", "oklch(0.85 0.1 60)");
    expect(failures(broken).some((c) => c.fg === "chart-3" && c.bg === "card")).toBe(true);
  });

  it("fails a foreground that does not stand out on its fill", () => {
    const broken = setVar(themeCss, "dark", "positive-foreground", "oklch(0.9 0 0)");
    expect(failures(broken).map((c) => `${c.scheme} ${c.fg}/${c.bg}`)).toEqual(["dark positive-foreground/positive"]);
  });

  it("fails a dark block that leaves a checked token to the light value", () => {
    const darkStart = themeCss.indexOf("@variant dark {");
    const broken = themeCss.slice(0, darkStart) + themeCss.slice(darkStart).replace(/\n\s*--positive:[^;]+;/, "");
    expect(() => checkContrast(readTheme(broken))).toThrow("dark: --positive is not set in the dark block");
  });

  it("fails a chart colour outside sRGB", () => {
    expect(checkGamut(readTheme(themeCss))).toEqual([]);
    const broken = setVar(themeCss, "dark", "chart-3", "oklch(0.86 0.16 80)");
    expect(checkGamut(readTheme(broken))).toEqual([
      "dark --chart-3 oklch(0.86 0.16 80) is outside sRGB; lower its chroma",
    ]);
  });
});

describe("siyahi-contrast command", () => {
  // The bin link the workspace installs, as a package manager installs it.
  const bin = fileURLToPath(new URL("../../../node_modules/.bin/siyahi-contrast", import.meta.url));
  const run = (/** @type {string} */ css) => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "siyahi-contrast-")), "theme.css");
    writeFileSync(file, css);
    return spawnSync(bin, [file], { encoding: "utf8" });
  };

  it("exits 0 and reports the closest pair for the shipped theme", () => {
    const result = run(themeCss);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^contrast: 64\/64 pairs pass/);
  });

  it("exits 1 and names the failing pair for a broken theme", () => {
    const result = run(setVar(themeCss, "light", "chart-2", "oklch(0.62 0.07 163.2)"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("FAIL light --chart-1");
  });
});
