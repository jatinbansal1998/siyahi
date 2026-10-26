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

/** The colour a tile's sparkline is drawn in. */
const stroke = (label: string): Promise<string | null> =>
  tile(label).locator(".recharts-line-curve").getAttribute("stroke", { timeout: 5000 });

describe("MetricStrip sparklines", { timeout: 60_000 }, () => {
  it("fits the line to its values, from the box's bottom to its top", async () => {
    const sparkline = tile("Invested").locator('[data-slot="sparkline"]');
    await sparkline.scrollIntoViewIfNeeded();
    const line = sparkline.locator(".recharts-line-curve");
    const box = await sparkline.boundingBox();
    if (!box) throw new Error("not laid out");
    // A rising run fills the plot: the box less the 2px kept above and below. An axis from zero drew it about 3px tall.
    await expect
      .poll(() => line.evaluate((path) => Math.round((path as SVGPathElement).getBBox().height)), { timeout: 5000 })
      .toBe(box.height - 4);
  });

  it("colours each trend by the sign of its change", async () => {
    expect(await stroke("Portfolio value")).toBe("var(--positive)");
    expect(await stroke("XIRR")).toBe("var(--negative)");
  });
});
