// The histogram example in Chromium: the mark lines' places come from laid-out bars.
import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { openCatalogue, type Catalogue } from "./catalogue";

let catalogue: Catalogue;
let page: Page;

beforeAll(async () => {
  catalogue = await openCatalogue("data/histogram-chart");
  page = catalogue.page;
}, 60_000);

afterAll(async () => {
  await catalogue?.close();
});

describe("HistogramChartCard", { timeout: 60_000 }, () => {
  it("draws each mark through the bucket that holds it and writes its figure under the chart", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Checkout response times" });
    await expect
      .poll(() => chart.locator('[data-slot="histogram-marks"]').textContent())
      .toBe("median 273 ms · p95 904 ms");
    const boxes = () =>
      chart
        .locator(".recharts-bar-rectangle path")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
    // Recharts grows the bars in after the first paint; read them once they stand at full height.
    let last = "";
    await expect
      .poll(async () => {
        const read = await boxes();
        const now = JSON.stringify(read);
        const settled = now === last && read.length === 11 && read.every((box) => box.height > 0);
        last = now;
        return settled;
      })
      .toBe(true);
    const bars = await boxes();
    const lines = await chart
      .locator(".recharts-reference-line-line")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().x));
    // 273 ms is in the 200–300 bucket, the third; 904 ms in the 900–1,000 bucket, the tenth.
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBeGreaterThan(bars[2]!.left);
    expect(lines[0]).toBeLessThan(bars[2]!.right);
    expect(lines[1]).toBeGreaterThan(bars[9]!.left);
    expect(lines[1]).toBeLessThan(bars[9]!.right);
  });

  it("lays each mark line over a card-coloured band, so it stays traceable across the dark bars", async () => {
    const chart = page.locator('[data-slot="card"]', { hasText: "Checkout response times" });
    const pairs = await chart
      .locator(".recharts-reference-line")
      .evaluateAll((groups) =>
        groups.map((group) => [...group.querySelectorAll("line")].map((line) => line.getAttribute("stroke"))),
      );
    expect(pairs).toEqual([
      ["var(--card)", "var(--foreground)"],
      ["var(--card)", "var(--foreground)"],
    ]);
  });
});
