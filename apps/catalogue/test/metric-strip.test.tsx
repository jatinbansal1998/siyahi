// Reads the catalogue's MetricStrip example in Chromium: a sparkline's line
// comes from Recharts' layout, which happy-dom does not compute.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("blocks/metric-strip");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The MetricStrip tile with this label. */
const tile = (label: string): Locator =>
  page.locator('[data-slot="metric-strip-item"]', { has: page.getByText(label, { exact: true }) });

/** The colour of a tile's sparkline's last step, the part that carries its sign. */
const stroke = (label: string): Promise<string | null> =>
  tile(label).locator(".sparkline-now .recharts-line-curve").getAttribute("stroke", { timeout: 5000 });

describe("MetricStrip sparklines", { timeout: 60_000 }, () => {
  it("fits the line to its values, from the box's bottom to its top", async () => {
    const sparkline = tile("Target").locator('[data-slot="sparkline"]');
    await sparkline.scrollIntoViewIfNeeded();
    const line = sparkline.locator(".recharts-line:not(.sparkline-now) .recharts-line-curve");
    const box = await sparkline.boundingBox();
    if (!box) throw new Error("not laid out");
    // A rising run fills the plot: the box less the 3px kept above and below for the end dot. An axis from zero drew
    // it about 3px tall.
    await expect
      .poll(() => line.evaluate((path) => Math.round((path as SVGPathElement).getBBox().height)), { timeout: 5000 })
      .toBe(box.height - 6);
  });

  it("draws the run muted and colours its last step by the sign of the change", async () => {
    expect(
      await tile("Revenue").locator(".recharts-line:not(.sparkline-now) .recharts-line-curve").getAttribute("stroke"),
    ).toBe("var(--muted-foreground)");
    expect(await stroke("Revenue")).toBe("var(--positive)");
    expect(await stroke("Gross margin")).toBe("var(--negative)");
  });
});
