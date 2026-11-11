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

/**
 * Resizes the page and waits until the chart has redrawn at the new width in its loaded font. Under load the page
 * takes up to a second to lay out again, and a poll for four corner names, which the old layout already had, timed
 * out before its first read came back.
 */
async function resize(width: number) {
  await page.setViewportSize({ width, height: 1000 });
  const plot = await chart.locator('[data-slot="chart"]').elementHandle();
  await page.waitForFunction(
    (box) =>
      document.fonts.status === "loaded" &&
      box?.querySelector("svg.recharts-surface")?.getAttribute("width") === String(box.clientWidth) &&
      box.querySelector('[data-slot="scatter-quadrant-names"] text') !== null,
    plot,
  );
}

/** The corner names', points' names' and dots' boxes, read at one moment, so no redraw falls between them. */
const layout = () =>
  chart.evaluate((card) => {
    const of = (selector: string) =>
      [...card.querySelectorAll(selector)].map((el) => el.getBoundingClientRect().toJSON() as DOMRect);
    return {
      corners: of('[data-slot="scatter-quadrant-names"] text'),
      names: of('[data-slot="scatter-labels"] text'),
      circles: of('[data-slot="scatter-point"]'),
    };
  });

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
    it(`keeps the four corner names apart and clear of the points' names and dots at ${width} wide`, async () => {
      await resize(width);
      const { corners, names, circles } = await layout();
      expect(corners).toHaveLength(4);
      const clashes = corners.flatMap((a, i) => [...corners.slice(i + 1), ...names].filter((b) => overlap(a, b)));
      expect(clashes).toEqual([]);
      // Nor do the corner names sit on any dot: they keep to the bands the axis leaves above and below the data.
      expect(corners.flatMap((a) => circles.filter((b) => overlap(a, b)))).toEqual([]);
    });
  }

  it("rings each sized dot in the card colour, so overlapping dots keep their outlines", async () => {
    const rings = await chart
      .locator('[data-slot="scatter-point"]')
      .evaluateAll((points) =>
        points.map((dot) => [
          dot.previousElementSibling?.getAttribute("stroke"),
          dot.previousElementSibling?.getAttribute("fill"),
        ]),
      );
    expect(rings.length).toBeGreaterThan(0);
    expect(new Set(rings.map((ring) => ring.join(" ")))).toEqual(new Set(["var(--card) none"]));
  });

  it("selects a tapped dot and prints its figures under the chart", async () => {
    await page.setViewportSize({ width: 390, height: 1000 });
    const milk = chart.locator('[data-slot="scatter-point"][data-key="Full-cream milk"]');
    await milk.click();
    await expect.poll(() => milk.getAttribute("aria-pressed")).toBe("true");
    expect(await chart.locator('[data-slot="scatter-selection"]').innerText()).toBe(
      "Full-cream milk · price +3.0% · units +5.0% · ₹13.1L revenue",
    );
  });

  // Last, as it reloads the page. A name is placed by its width measured on a canvas; one measured in the fallback
  // before Geist arrived stayed cached for the page's life, and the names were drawn in Geist about 8px short (#83).
  it("places the corner names by Geist's widths when Geist arrives late", async () => {
    await page.route(/\.woff2$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    try {
      await page.reload();
      await resize(390);
      // The chart draws again once the fonts are ready; two frames let that render land.
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      });
      // A right-hand name is placed at the plot's right edge less 6px and its measured width, so its drawn right
      // edge lands on that line only if it was measured in the face it is drawn in.
      const gaps = await chart.evaluate((card) => {
        const plot = card.querySelector(".recharts-cartesian-grid")!.getBoundingClientRect();
        // Drawn top left, top right, bottom left, bottom right.
        return [...card.querySelectorAll('[data-slot="scatter-quadrant-names"] text')]
          .filter((_, i) => i % 2 === 1)
          .map((text) => Math.round(plot.right - 6 - text.getBoundingClientRect().right));
      });
      expect(gaps).toEqual([0, 0]);
    } finally {
      await page.unrouteAll();
    }
  });
});
