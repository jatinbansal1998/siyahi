// Measures the catalogue's SlopeChart labels in Chromium: whether they collide depends on text drawn at real widths,
// which happy-dom does not lay out.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/slope-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Every value label's box in the store-against-region chart, whose values crowd together. */
async function labels(): Promise<DOMRect[]> {
  const chart = page.locator('[data-slot="slope-chart"]').nth(1);
  await chart.locator("svg text").first().waitFor();
  return chart
    .locator('[data-slot="slope-chart-item"] text')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
}

const overlap = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe("SlopeChart layout", { timeout: 60_000 }, () => {
  for (const width of [1920, 390]) {
    it(`keeps every label clear of the others at ${width} wide`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(async () => (await labels()).length).toBe(18);
      const boxes = await labels();
      const clashes = boxes.flatMap((a, i) =>
        boxes
          .slice(i + 1)
          .filter((b) => overlap(a, b))
          .map((b) => [a, b]),
      );
      expect(clashes).toEqual([]);
    });
  }
});
