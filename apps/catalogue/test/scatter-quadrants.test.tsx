// The quadrants example in Chromium: dot sizes, draw order and where the corner names land come from laid-out
// boxes, which happy-dom does not compute.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;
let chart: Locator;

beforeAll(async () => {
  catalogue = await openCatalogue("data/scatter-chart");
  page = catalogue.page;
  chart = page.locator('[data-slot="card"]', { hasText: "Products by price and sales" });
  await chart.locator('[data-slot="scatter-quadrant-names"] text').first().waitFor();
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** Each dot's key and radius, in the order they are painted. */
const dots = () =>
  chart
    .locator('[data-slot="scatter-point"]')
    .evaluateAll((els) => els.map((el) => ({ key: el.getAttribute("data-key"), r: Number(el.getAttribute("r")) })));

const boxes = async (selector: string) =>
  chart.locator(selector).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));

const overlap = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe("ScatterChartCard with size and quadrants", { timeout: 60_000 }, () => {
  it("sizes each dot's area by its weight and paints the largest first", async () => {
    const painted = await dots();
    expect(painted[0]).toEqual({ key: "Basmati rice 5 kg", r: 20 });
    // Full-cream milk sells ₹13.1L against basmati's ₹18.4L: its area, not its radius, is that share.
    const milk = painted.find(({ key }) => key === "Full-cream milk")!;
    expect((milk.r / 20) ** 2).toBeCloseTo(1_310_000 / 1_840_000, 2);
  });

  for (const width of [1920, 390]) {
    it(`keeps the four corner names apart and clear of the points' names at ${width} wide`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(async () => (await boxes('[data-slot="scatter-quadrant-names"] text')).length).toBe(4);
      const corners = await boxes('[data-slot="scatter-quadrant-names"] text');
      const names = await boxes('[data-slot="scatter-labels"] text');
      const clashes = corners.flatMap((a, i) => [...corners.slice(i + 1), ...names].filter((b) => overlap(a, b)));
      expect(clashes).toEqual([]);
    });
  }
});
