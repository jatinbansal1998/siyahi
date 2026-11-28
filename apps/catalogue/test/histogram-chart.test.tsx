// The histogram examples in Chromium: the mark lines' places come from the laid-out axis.
import type { Locator, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { chartDrawn, openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/histogram-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

/** The middle of the x tick that reads `text`, in page pixels. */
const tickAt = (chart: Locator, text: string) =>
  chart
    .locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")
    .filter({ hasText: new RegExp(`^${text}$`) })
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.x + box.width / 2;
    });

/** The x of the line of the mark named `label`, in page pixels. */
const markAt = (chart: Locator, label: string) =>
  chart
    .locator('[data-slot="histogram-mark"]', { hasText: label })
    .locator("line")
    .last()
    .evaluate((el) => el.getBoundingClientRect().x);

describe("HistogramChartCard", { timeout: 60_000 }, () => {
  it("draws each percentile at its value on the axis and writes its figure under the chart", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Checkout response times" });
    await chartDrawn(chart, '[data-slot="histogram-mark"]');
    expect(await chart.locator('[data-slot="histogram-marks"]').textContent()).toBe("median 273 ms · p95 904 ms");
    const [from, to] = [await tickAt(chart, "200"), await tickAt(chart, "300")];
    const median = await markAt(chart, "median");
    // 273 ms is 73% of the way from the 200 tick to the 300 one, not in the middle of that bucket.
    expect(Math.abs(median - (from + (to - from) * 0.73))).toBeLessThan(1.5);
  });

  it("draws a value mark at its value, on the tick that names it", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Today's fall was the steepest" });
    await chartDrawn(chart, '[data-slot="histogram-mark"]');
    const zero = await tickAt(chart, "0.0%");
    expect(Math.abs((await markAt(chart, "zero")) - zero)).toBeLessThan(1.5);
  });

  it("lays each mark line over a card-coloured band, so it stays traceable across the dark bars", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Checkout response times" });
    const pairs = await chart
      .locator('[data-slot="histogram-mark"]')
      .evaluateAll((groups) =>
        groups.map((group) => [...group.querySelectorAll("line")].map((line) => line.getAttribute("stroke"))),
      );
    expect(pairs).toEqual([
      ["var(--card)", "var(--foreground)"],
      ["var(--card)", "var(--foreground)"],
    ]);
  });

  it("keeps every mark's name on the plot and clear of the others on a phone", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const chart = page.locator('[data-slot="card"]', { hasText: "Today's fall was the steepest" });
    await chartDrawn(chart, '[data-slot="histogram-mark"]');
    const { names, plot } = await chart.evaluate((card) => {
      const grid = card.querySelector(".recharts-cartesian-grid")!.getBoundingClientRect();
      return {
        plot: { left: grid.left, right: grid.right },
        names: [...card.querySelectorAll('[data-slot="histogram-mark"] text')].map((el) => {
          const box = el.getBoundingClientRect();
          return { text: el.textContent, left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        }),
      };
    });
    expect(names.map(({ text }) => text).toSorted()).toEqual(["median", "today", "zero"]);
    for (const name of names) {
      expect(name.left).toBeGreaterThanOrEqual(plot.left - 0.5);
      expect(name.right).toBeLessThanOrEqual(plot.right + 0.5);
    }
    for (const a of names)
      for (const b of names) {
        const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        if (a !== b) expect(apart, `${a.text} overlaps ${b.text}`).toBe(true);
      }
  });
});
