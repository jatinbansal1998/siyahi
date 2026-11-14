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
const named = (/** @type {string} */ css) => failures(css).map((c) => `${c.scheme} ${c.fg} on ${c.bg}`);

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

  it("fails text between 3:1 and 4.5:1 on the page and a popover", () => {
    // About 3.7:1 on white: enough for a chart mark, not for text.
    const broken = setVar(themeCss, "light", "muted-foreground", "oklch(0.62 0 0)");
    expect(named(broken)).toEqual(
      expect.arrayContaining(["light --muted-foreground on --background", "light --muted-foreground on --popover"]),
    );
  });

  it("blends a translucent tint over the surface under it", () => {
    // shadcn's red passes on a plain popover (4.8:1) but not on its own 20% hover tint over it (3.3:1).
    const broken = setVar(themeCss, "light", "destructive", "oklch(0.577 0.235 27.325)");
    expect(named(broken)).toContain("light --destructive on --destructive/20 over --popover");
    expect(named(broken)).not.toContain("light --destructive on --popover");
  });

  it("fails muted text on a Callout's tint", () => {
    // shadcn's muted grey: 4.7:1 on a popover, 4.1:1 on the accent Callout's indigo wash over it.
    const broken = setVar(themeCss, "light", "muted-foreground", "oklch(0.556 0 0)");
    expect(named(broken)).toContain("light --muted-foreground on --chart-1/8 over --popover");
    expect(named(broken)).not.toContain("light --muted-foreground on --popover");
  });

  it("fails a pale chart slot against the band behind a hovered category", () => {
    const broken = setVar(themeCss, "light", "chart-4", "oklch(0.66 0.11 235)");
    expect(named(broken)).toContain("light --chart-4 on --muted/40 over --popover");
  });

  it("checks a tint mixed into the page, not only into a popover", () => {
    // The hover band was checked on the card alone, where this slot passed; on the page it does not.
    const broken = setVar(themeCss, "light", "chart-4", "oklch(0.65 0.11 235)");
    expect(named(broken)).toEqual(["light --chart-4 on --muted/40 over --background"]);
    // A heat step's label is checked on the step mixed into each surface.
    const heat = checkContrast(readTheme(themeCss)).filter(
      (c) => c.bg.startsWith("--positive") && c.bg.includes(" in --"),
    );
    expect(new Set(heat.map((c) => c.bg.split(" in ")[1]))).toEqual(new Set(["--background", "--popover"]));
  });

  it("starts dark mode's heat at a quarter tint, so the first step does not read as the card", () => {
    // Moved from the treemap test when the shares became theme tokens.
    expect(readTheme(themeCss).dark["heat-1"]).toBe("25%");
    expect(readTheme(themeCss).light["heat-1"]).toBe("12%");
  });

  it("reads each heat step's share from the theme, so a deeper dark step fails its label", () => {
    const broken = setVar(themeCss, "dark", "heat-5", "75%");
    expect(named(broken)).toContain("dark --foreground on --positive 75% in --popover");
  });

  it("reads an exception's wash from the theme, and lays a StatusBadge's tint over it", () => {
    // A 20% wash darkens a marked tile or row until its muted lines and its badge's red dot no longer read.
    const broken = setVar(themeCss, "light", "wash", "20%");
    expect(named(broken)).toEqual(
      expect.arrayContaining([
        "light --muted-foreground on --negative 20% in --popover",
        "light --muted-foreground on --negative/wash over --popover",
        "light --negative on --negative/8 over --negative/wash over --background",
      ]),
    );
  });

  it("fails a stat tile's Sparkline on a dark amber wash at the mock-up's 15%", () => {
    const broken = setVar(themeCss, "dark", "wash", "15%");
    expect(named(broken)).toEqual(
      expect.arrayContaining([
        "dark --chart-1 on --warning 15% in --popover",
        "dark --chart-1 on --warning/wash over --popover",
      ]),
    );
  });

  it("fails a focus outline too pale to read against a tab list or the sidebar", () => {
    const broken = setVar(themeCss, "light", "ring", "oklch(0.75 0 0)");
    expect(named(broken)).toEqual(expect.arrayContaining(["light --ring on --muted", "light --ring on --sidebar"]));
  });

  it("fails a degraded day that a healthy day's grey swallows", () => {
    // A darker muted grey still reads as text, but its 30% healthy fill comes too close to the amber.
    const broken = setVar(themeCss, "light", "muted-foreground", "oklch(0.3 0 0)");
    expect(named(broken)).toContain("light --warning on --muted-foreground/30 over --popover");
  });

  it("fails a treemap label on its deepest heat step", () => {
    const broken = setVar(themeCss, "dark", "positive", "oklch(0.74 0.16 151.711)");
    expect(named(broken)).toEqual(["dark --foreground on --positive 60% in --popover"]);
  });

  it("fails a field edge under 3:1, translucent or not", () => {
    expect(named(setVar(themeCss, "light", "input", "oklch(0.922 0 0)"))).toContain("light --input on --popover");
    expect(named(setVar(themeCss, "dark", "input", "oklch(1 0 0 / 15%)"))).toContain(
      "dark --input over --popover on --popover",
    );
  });

  it("fails a chart colour too close to its neighbour", () => {
    const broken = setVar(themeCss, "dark", "chart-2", "oklch(0.84 0.09 160)");
    expect(named(broken)).toEqual(["dark --chart-1 on --chart-2", "dark --chart-2 on --chart-3"]);
  });

  it("fails a chart colour too faint against a popover", () => {
    const broken = setVar(themeCss, "light", "chart-3", "oklch(0.85 0.1 60)");
    expect(named(broken)).toContain("light --chart-3 on --popover");
  });

  it("fails bars at the old 25% tint: pale neighbours in light, dim ones on a dark popover", () => {
    // Issue #94: at 25% a thin --chart-4 segment read as one with --chart-5 beside it, and dark bars read as the card.
    expect(named(setVar(themeCss, "light", "bar-tint", "25%"))).toEqual(
      expect.arrayContaining([
        "light --chart-4 25% in --popover on --chart-5 25% in --popover",
        "light --chart-4 25% in --popover on --popover",
      ]),
    );
    expect(named(setVar(themeCss, "dark", "bar-tint", "25%"))).toEqual(
      expect.arrayContaining([
        "dark --chart-1 25% in --popover on --popover",
        "dark --chart-5 25% in --popover on --popover",
      ]),
    );
  });

  it("fails a foreground that does not stand out on its fill", () => {
    const broken = setVar(themeCss, "dark", "positive-foreground", "oklch(0.9 0 0)");
    expect(named(broken)).toEqual(["dark --positive-foreground on --positive"]);
  });

  it("fails a dark block that leaves a checked token to the light value", () => {
    const darkStart = themeCss.indexOf("@variant dark {");
    const broken = themeCss.slice(0, darkStart) + themeCss.slice(darkStart).replace(/\n\s*--positive:[^;]+;/, "");
    expect(() => checkContrast(readTheme(broken))).toThrow("dark: --positive is not set in the dark block");
  });

  it("fails a meaning colour outside sRGB", () => {
    const broken = setVar(themeCss, "light", "negative", "oklch(0.577 0.245 27.325)");
    expect(checkGamut(readTheme(broken))).toEqual([
      "light --negative oklch(0.577 0.245 27.325) is outside sRGB; lower its chroma",
    ]);
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
    expect(result.stdout).toMatch(/^contrast: 398\/398 pairs pass/);
  });

  it("exits 1 and names the failing pair for a broken theme", () => {
    const result = run(setVar(themeCss, "light", "chart-2", "oklch(0.62 0.07 163.2)"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("FAIL light --chart-1");
  });
});
