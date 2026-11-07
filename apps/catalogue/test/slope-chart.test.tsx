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
    it(`keeps every label clear of the others and inside the drawing at ${width} wide`, async () => {
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
      // Every heading and value stays inside the drawing, the long "This store, this year" heading included.
      const chart = page.locator('[data-slot="slope-chart"]').nth(1);
      const frame = (await chart.locator("svg").boundingBox())!;
      const texts = await chart
        .locator("svg text")
        .evaluateAll((els) =>
          els.map((el) => ({ text: el.textContent, box: el.getBoundingClientRect().toJSON() as DOMRect })),
        );
      const outside = texts.filter(({ box }) => box.left < frame.x - 0.5 || box.right > frame.x + frame.width + 0.5);
      expect(outside).toEqual([]);
    });
  }

  it("lays a card-coloured halo under each highlighted line, so grey lines it crosses never touch it", async () => {
    const chart = page.locator('[data-slot="slope-chart"]').first();
    const strokes = await chart
      .locator('[data-slot="slope-chart-item"][data-highlighted] line')
      .evaluateAll((lines) =>
        lines.map((line) => [line.getAttribute("stroke"), Number(line.getAttribute("stroke-width"))]),
      );
    // Two highlighted channels, each a wide card stroke under a narrower accent one.
    expect(strokes).toEqual([
      ["var(--card)", 6.5],
      ["var(--chart-1)", 2.5],
      ["var(--card)", 6.5],
      ["var(--chart-1)", 2.5],
    ]);
  });
});
