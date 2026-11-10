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

describe("MetricStrip tones", { timeout: 60_000 }, () => {
  it("washes only the figure the page marks, as a SectionCards tile, and outlines it on the hairlines around it", async () => {
    const fills = await page
      .locator('[data-slot="metric-strip-item"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    const tileWash = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.backgroundColor = "color-mix(in oklab, var(--negative) var(--wash), var(--card))";
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    // Cash flow, the fourth figure, is marked negative; the others show the card through.
    expect(fills.map((fill) => (fill === "rgba(0, 0, 0, 0)" ? "clear" : fill === tileWash ? "wash" : fill))).toEqual([
      "clear",
      "clear",
      "clear",
      "wash",
      "clear",
      "clear",
    ]);
    const outline = await tile("Cash flow").evaluate((el) => {
      const box = el.getBoundingClientRect();
      const ring = getComputedStyle(el, "::after");
      return {
        // Its start and top, and how much wider and taller than the figure's box it is.
        box: [
          Number.parseFloat(ring.left),
          Number.parseFloat(ring.top),
          Number.parseFloat(ring.width) - box.width,
          Number.parseFloat(ring.height) - box.height,
        ],
        border: ring.borderTopWidth,
        colour: ring.borderTopColor,
      };
    });
    // It starts on the rule before the figure and the one above it, and ends on the figure's own end and bottom rules.
    // Chromium writes a computed width to three decimals, so the box is compared to a hundredth of a pixel.
    expect(outline.box.map((edge) => Math.round(edge * 100) / 100)).toEqual([-1, -1, 1, 1]);
    expect(outline.border).toBe("1px");
    expect(outline.colour).not.toBe("rgba(0, 0, 0, 0)");
  });
});
