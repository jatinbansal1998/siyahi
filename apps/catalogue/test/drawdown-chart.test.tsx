// The drawdown example in Chromium: Recharts draws the marker only once the plot is laid out.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/drawdown-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("DrawdownChartCard", { timeout: 60_000 }, () => {
  it("names the deepest fall on a dashed line at the lowest point of the area", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Cash below its best" });
    // Recharts draws a reference line's label in a layer of its own, so each is found by itself.
    await expect.poll(() => chart.getByText("Deepest −20.9%").count()).toBe(1);
    const lineY = Number(
      await chart.locator('.recharts-reference-line-line[stroke-dasharray="4 4"]').getAttribute("y1"),
    );
    const lowest = await chart
      .locator(".recharts-area-curve")
      .evaluate((path) => Math.max(...[...path.getAttribute("d")!.matchAll(/,([\d.]+)/g)].map(([, y]) => Number(y))));
    expect(lineY).toBeCloseTo(lowest, 0);
  });

  it("lays a card-coloured halo under the label, so it reads over the red area too", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Cash below its best" });
    const label = chart.getByText("Deepest −20.9%").locator("xpath=ancestor-or-self::*[local-name()='text'][1]");
    const halo = await label.evaluate((text) => {
      const style = getComputedStyle(text);
      return { paintOrder: style.paintOrder, width: style.strokeWidth, stroke: style.stroke };
    });
    const card = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--card)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(halo).toEqual({ paintOrder: "stroke", width: "3px", stroke: card });
  });
});
