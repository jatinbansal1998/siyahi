// The drawdown example in Chromium: Recharts draws the marker only once the plot is laid out.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, themeColor, type Catalogue } from "./catalogue";

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
    // Recharts draws a reference line's label in a layer of its own, so each is found by itself, once the plot is laid
    // out: with the stacked example's charts drawing beside it, that can take a busy machine more than a second.
    await chart.getByText("Deepest −20.9%").waitFor();
    expect(await chart.getByText("Deepest −20.9%").count()).toBe(1);
    const lineY = Number(
      await chart.locator('.recharts-reference-line-line[stroke-dasharray="4 4"]').getAttribute("y1"),
    );
    const lowest = await chart
      .locator(".recharts-area-curve")
      .evaluate((path) => Math.max(...[...path.getAttribute("d")!.matchAll(/,([\d.]+)/g)].map(([, y]) => Number(y))));
    expect(lineY).toBeCloseTo(lowest, 0);
  });

  it("lays a page-coloured halo under the label, so it reads over the red area too", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Cash below its best" });
    const label = chart.getByText("Deepest −20.9%").locator("xpath=ancestor-or-self::*[local-name()='text'][1]");
    const halo = await label.evaluate((text) => {
      const style = getComputedStyle(text);
      return { paintOrder: style.paintOrder, width: style.strokeWidth, stroke: style.stroke };
    });
    // The halo is var(--card), which inside an open card, the default, is the page colour under the chart.
    expect(halo).toEqual({ paintOrder: "stroke", width: "3px", stroke: await themeColor(page, "--background") });
  });

  it("shares its plot's edges with the line chart above it on one syncId, so a date sits at the same x in both", async () => {
    const line = page.locator('[data-slot="card"]', { hasText: "this year" });
    const fall = page.locator('[data-slot="card"]', { hasText: "The worst fall was" });
    await fall.scrollIntoViewIfNeeded();
    await fall.locator(".recharts-cartesian-grid").waitFor();
    // The line chart's ticks are shorter (+30%) than the fall's (−15.0%), and only it keeps a gutter for the names
    // at its line ends: on their own, its plot would start further left and end further left.
    const edges = async () => {
      const boxes = await Promise.all(
        [line, fall].map((card) => card.locator(".recharts-cartesian-grid").boundingBox()),
      );
      return boxes.map((box) => box && [Math.round(box.x), Math.round(box.x + box.width)]);
    };
    await expect
      .poll(async () => {
        const [top, bottom] = await edges();
        return top !== null && JSON.stringify(top) === JSON.stringify(bottom);
      })
      .toBe(true);
  });
});
