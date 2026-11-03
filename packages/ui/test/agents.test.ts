import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import * as ui from "../src/index";
import manifest from "../agents/manifest.json";

describe("agent discovery", () => {
  it("routes a ranked comparison to a readable example using public exports", () => {
    const choice = manifest.needs.find(({ need }) => need.includes("Ranked counts"));
    expect(choice?.components).toEqual(["BarList"]);
    const example = manifest.examples.find(({ components }) => components.includes("BarList"));
    if (!example) throw new Error("No published BarList example");
    const source = readFileSync(new URL(`../${example.file}`, import.meta.url), "utf8");
    expect(source).toContain("<BarList");
    for (const name of example.components) expect(name in ui, name).toBe(true);
  });

  it("offers design choices rather than Markdown table headers", () => {
    expect(manifest.needs.length).toBeGreaterThan(0);
    for (const { need, guidance } of manifest.needs) {
      expect(need).toMatch(/[a-z]/i);
      expect(guidance).toMatch(/[a-z]/i);
    }
  });
});
