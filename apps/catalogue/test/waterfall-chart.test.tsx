// The waterfall examples in Chromium: a cut axis' totals and break mark are drawn by Recharts' layout.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { chartDrawn, openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/waterfall-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The vertical middle of a box, in page pixels. */
async function middle(box: Promise<{ y: number; height: number } | null>): Promise<number> {
  const { y, height } = (await box)!;
  return y + height / 2;
}

describe("WaterfallChartCard", { timeout: 60_000 }, () => {
  it("draws each total on a cut axis as a line at its level, and marks the cut", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "The portfolio grew" });
    await chartDrawn(chart, '[data-slot="waterfall-axis-cut"]');
    // Two totals as lines, six changes as bars.
    expect(await chart.locator('[data-slot="waterfall-level"]').count()).toBe(2);
    expect(await chart.locator(".recharts-bar-rectangle path").count()).toBe(6);
    expect(await chart.getByRole("img", { name: "The value axis starts at ₹90,00,000, not zero" }).count()).toBe(1);
    // The opening line sits level with the ₹1 Cr tick.
    const opening = await middle(chart.locator('[data-slot="waterfall-level"]').first().boundingBox());
    const tick = await middle(
      chart
        .locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")
        .filter({ hasText: /^₹1 Cr$/ })
        .boundingBox(),
    );
    expect(Math.abs(opening - tick)).toBeLessThan(2);
  });

  it("draws the dashed connectors behind the bars", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "The portfolio grew" });
    const behind = await chart.evaluate((card) => {
      const connector = card.querySelector(".recharts-reference-line")!;
      const level = card.querySelector('[data-slot="waterfall-level"]')!;
      return Boolean(connector.compareDocumentPosition(level) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(behind).toBe(true);
  });
});
